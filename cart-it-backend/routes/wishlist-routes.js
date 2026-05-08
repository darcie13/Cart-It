/**
 * Wishlist Routes
 * Handles all wishlist-related functionality including:
 * - creating wishlists
 * - fetching user wishlists
 * - viewing wishlist details
 * - collaboration invites via email
 * - deleting wishlists and cleanup logic
 * - public wishlist sharing
 */

const express = require("express");
const router = express.Router();
const db = require("../config/db");

const sendEmail = require("../utils/send-emails");

// CREATE WISHLIST (also assigns creator as owner in wishlist_members)
router.post("/", (req, res) => {
    const { owner_id, name } = req.body;

    const sql = "INSERT INTO wishlists (owner_id, name) VALUES (?, ?)";

    db.query(sql, [owner_id, name], (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).send("Error creating wishlist: " + err.message);
        }

        const newWishlistId = result.insertId;

        // Automatically add creator as owner in membership table
        const memberSql =
            "INSERT INTO wishlist_members (wishlist_id, user_id, role) VALUES (?, ?, 'owner')";

        db.query(memberSql, [newWishlistId, owner_id], (memberErr) => {
            if (memberErr) {
                console.error("Error setting owner:", memberErr);
            }

            // Inside router.post("/")
            res.status(201).json({
            wishlist_id: newWishlistId, 
            name: name,
            total_items: 0,            
            preview_images: [],
            is_shared: false
            });
        });
    });
});


// GET ALL WISHLISTS FOR A USER (owned + shared)
router.get("/", (req, res) => {
    const user_id = req.query.owner_id;

    const sql = `
        SELECT 
            w.wishlist_id, 
            w.name, 
            w.owner_id,
            w.is_archived,
            w.is_completed,
            w.completed_at,
            wm.role,
            COUNT(
                DISTINCT CASE
                WHEN i.is_purchased = 0 THEN i.item_id
                END
            ) as active_items,
            COUNT(DISTINCT i.item_id) as total_items,
            (SELECT GROUP_CONCAT(image_url SEPARATOR ',') 
             FROM (SELECT image_url FROM items WHERE wishlist_id = w.wishlist_id LIMIT 4) as temp) as preview_images
        FROM wishlists w
        JOIN wishlist_members wm ON w.wishlist_id = wm.wishlist_id
        LEFT JOIN items i ON w.wishlist_id = i.wishlist_id
        WHERE wm.user_id = ?
        AND w.is_archived = 0   
        GROUP BY w.wishlist_id, wm.role
    `;

    db.query(sql, [user_id], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error fetching wishlists");
        }

        // Format preview images into array + add shared flag
        const formattedResults = results.map((list) => ({
            ...list,
            preview_images: list.preview_images
                ? list.preview_images.split(",")
                : [],
            is_shared: list.role !== "owner",
            is_completed: !!list.is_completed,
            active_items: list.active_items,
            total_items: list.total_items
        }));

        res.json(formattedResults);
    });
});

// GET SINGLE WISHLIST DETAILS
router.get("/details/:id", (req, res) => {
    const { id } = req.params;
    const user_id = req.query.user_id;

    const sql = `
        SELECT w.*, wm.role 
        FROM wishlists w
        LEFT JOIN wishlist_members wm 
        ON w.wishlist_id = wm.wishlist_id AND wm.user_id = ?
        WHERE w.wishlist_id = ?
    `;

    db.query(sql, [user_id, id], (err, results) => {
        if (err || results.length === 0) {
            return res.status(404).send("Wishlist not found");
        }

        res.json(results[0]);
    });
});

// COLLABORATION INVITE ROUTE (adds user + sends email invite)
router.post("/collab", async (req, res) => {
    const { wishlist_id, email } = req.body;

    // Fetch wishlist name for email personalization
    db.query(
        "SELECT name FROM wishlists WHERE wishlist_id = ?",
        [wishlist_id],
        (wishlistErr, wishlistResults) => {
            if (wishlistErr || wishlistResults.length === 0) {
                return res.status(404).send("Wishlist not found");
            }

            const wishlistName = wishlistResults[0].name;

            // Find invited user
            const findUserSql =
                "SELECT user_id, username FROM users WHERE email = ?";

            db.query(findUserSql, [email], (err, users) => {
                if (err) return res.status(500).send("Database error");
                if (users.length === 0) {
                    return res
                        .status(404)
                        .send("User does not have a Cart-It account.");
                }

                const guest = users[0];

                // Add collaborator to wishlist_members
                const insertMemberSql =
                    "INSERT INTO wishlist_members (wishlist_id, user_id, role) VALUES (?, ?, 'editor')";

                db.query(
                    insertMemberSql,
                    [wishlist_id, guest.user_id],
                    async (insertErr) => {
                        if (insertErr) {
                            if (insertErr.code === "ER_DUP_ENTRY") {
                                return res
                                    .status(400)
                                    .send("User already a collaborator");
                            }
                            return res
                                .status(500)
                                .send("Error adding collaborator");
                        }

                        // Send collaboration email
                        await sendEmail({
                            to: email,
                            subject: `Collaboration Invite: ${wishlistName}`,
                            html: `
                                <div style="background-color: #f9fafb; padding: 40px 0; font-family: sans-serif;">
                                    <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; padding: 40px; text-align: center;">
                                        <h1 style="color: #111827;">You've been invited!</h1>
                                        <p style="color: #4b5563;">
                                            Hi <strong>${guest.username}</strong>, you've been invited to collaborate on the wishlist: <strong>${wishlistName}</strong>.
                                        </p>
                                        <a href="http://localhost:3001/dashboard" style="display: inline-block; background-color: #DB8046; color: #ffffff; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: bold;">View Dashboard</a>
                                    </div>
                                </div>
                            `
                        });

                        res.status(200).send("Collaborator added successfully");
                    }
                );
            });
        }
    );
});

// ARCHIVE WISHLIST
router.patch("/:id/archive", (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;

    const authSql = `
        SELECT *
        FROM wishlist_members
        WHERE wishlist_id = ?
        AND user_id = ?
    `;

    db.query(authSql, [id, userId], (authErr, authResults) => {
        if (authErr) return res.status(500).send(authErr);

        if (!authResults.length) {
            return res.status(403).send("Access denied");
        }

        const archiveSql = `
            UPDATE wishlists
            SET
                is_archived = 1,
                archived_at = NOW()
            WHERE wishlist_id = ?
        `;

        db.query(archiveSql, [id], (archiveErr) => {
            if (archiveErr) {
                return res.status(500).send(archiveErr);
            }

            res.status(200).json({
                success: true,
                archived: true
            });
        });
    });
});

// GET ARCHIVED WISHLISTS
router.get("/archived/all", (req, res) => {
    const userId = req.query.user_id;

    const sql = `
        SELECT
            w.wishlist_id,
            w.name,
            w.owner_id,
            w.completed_at,
            w.archived_at,
            wm.role,

            COUNT(DISTINCT i.item_id) as total_items,

            (
                SELECT GROUP_CONCAT(image_url SEPARATOR ',')
                FROM (
                    SELECT image_url
                    FROM items
                    WHERE wishlist_id = w.wishlist_id
                    LIMIT 4
                ) temp
            ) as preview_images

        FROM wishlists w

        JOIN wishlist_members wm
            ON w.wishlist_id = wm.wishlist_id

        LEFT JOIN items i
            ON w.wishlist_id = i.wishlist_id

        WHERE wm.user_id = ?
        AND w.is_archived = 1

        GROUP BY w.wishlist_id, wm.role

        ORDER BY w.archived_at DESC
    `;

    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error(err);
            return res
                .status(500)
                .send("Error fetching archived wishlists");
        }

        const formatted = results.map((list) => ({
            ...list,
            preview_images: list.preview_images
                ? list.preview_images.split(",")
                : [],
            is_shared: list.role !== "owner"
        }));

        res.json(formatted);
    });
});

// DELETE WISHLIST (cleans up items before removal)
router.delete("/:id", (req, res) => {
    const { id } = req.params;
    const userId = req.query.user_id;

    const checkAuth =
        "SELECT role FROM wishlist_members WHERE wishlist_id = ? AND user_id = ?";

    db.query(checkAuth, [id, userId], (err, results) => {
        if (
            err ||
            results.length === 0 ||
            results[0].role !== "owner"
        ) {
            return res
                .status(403)
                .send("Only the owner can delete this wishlist.");
        }

        const updateItems =
            "UPDATE items SET wishlist_id = NULL WHERE wishlist_id = ?";

        db.query(updateItems, [id], (err) => {
            if (err) return res.status(500).send(err);

            const deleteWishlist =
                "DELETE FROM wishlists WHERE wishlist_id = ?";

            db.query(deleteWishlist, [id], (err) => {
                if (err) return res.status(500).send(err);
                res.status(200).send("Wishlist deleted successfully");
            });
        });
    });
});

// PUBLIC WISHLIST SHARE VIEW (no auth required)
router.get("/public/:share_token/:wishlist_id", (req, res) => {
    const { share_token, wishlist_id } = req.params;

    const sql = `
        SELECT i.*, u.username, w.name as wishlist_name
        FROM items i
        JOIN users u ON i.user_id = u.user_id
        JOIN wishlists w ON i.wishlist_id = w.wishlist_id
        WHERE u.share_token = ? 
        AND i.wishlist_id = ?
    `;

    db.query(sql, [share_token, wishlist_id], (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });

        if (results.length === 0) {
            return res
                .status(404)
                .json({ error: "Wishlist not found or empty" });
        }

        res.json(results);
    });
});

module.exports = router;