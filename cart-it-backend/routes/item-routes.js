/**
 * Item Routes
 * Handles all CRUD operations for items including:
 * - fetching cart and wishlist items
 * - adding/removing/moving items
 * - marking purchases
 * - price history tracking
 * - public share views
 */

const express = require("express");
const router = express.Router();
const db = require("../config/db");

const sendEmail = require("../utils/send-emails");

const normalizeNotes = (notesText) => {
    if (!notesText) return [];
    if (Array.isArray(notesText)) return notesText;

    try {
        const parsed = JSON.parse(notesText);
        if (Array.isArray(parsed)) return parsed;
    } catch (err) {
        // Not JSON; continue to legacy parsing
    }

    return notesText
        .split('\n')
        .filter(line => line.trim() !== "")
        .map((line, index) => {
            const match = line.match(/^\[(.*?)\]:\s*(.*)$/);
            return {
                id: `legacy-${index}-${Math.floor(Math.random() * 100000)}`,
                user: "Unknown",
                created_at: match ? new Date(match[1]).toISOString() : null,
                text: match ? match[2] : line
            };
        });
};

const buildNotePayload = (noteText, username) => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    user: username || "Unknown",
    created_at: new Date().toISOString(),
    text: noteText.trim()
});

// GET ITEMS FOR A SPECIFIC WISHLIST
router.get("/wishlist/:wishlist_id", (req, res) => {
    const { wishlist_id } = req.params;
    const currentUserId = req.user?.userId;

    const authSql = "SELECT role FROM wishlist_members WHERE wishlist_id = ? AND user_id = ?";
    db.query(authSql, [wishlist_id, currentUserId], (authErr, authResults) => {
        if (authErr) return res.status(500).json({ error: "DB Error" });
        if (!authResults || authResults.length === 0) {
            return res.status(403).json({ error: "Access denied" });
        }

        const sql = "SELECT i.*, pu.username as purchased_by_username FROM items i LEFT JOIN users pu ON i.purchased_by = pu.user_id WHERE wishlist_id = ?";
        db.query(sql, [wishlist_id], (err, results) => {
            if (err) return res.status(500).json({ error: "DB Error" });
            res.json(results);
        });
    });
});

// GET ALL MAIN CART ITEMS (items not in a wishlist and not purchased)
router.get("/", (req, res) => {
    const user_id = req.query.user_id;

    const query = `
        SELECT * FROM items 
        WHERE user_id = ?  
        AND is_purchased = 0 
        ORDER BY updated_at DESC
    `;

    db.query(query, [user_id], (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json(results);
    });
});

// REMOVE ITEMS FROM WISHLIST (moves items back to main cart)
router.put("/remove-from-wishlist", (req, res) => {
    const { ids } = req.body;
    const sql = "UPDATE items SET wishlist_id = NULL WHERE item_id IN (?)";

    db.query(sql, [ids], (err) => {
        if (err) return res.status(500).send("Error updating items");
        res.send("Success");
    });
});

// ADD ITEM MANUALLY TO CART OR WISHLIST
router.post("/", (req, res) => {
    const {
        user_id,
        wishlist_id,
        product_name,
        price,
        product_url,
        store_name,
        image_url,
        notes
    } = req.body;

    const sql = `
        INSERT INTO items 
        (user_id, wishlist_id, product_name, price, product_url, store_name, image_url, notes) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [user_id, wishlist_id, product_name, price, product_url, store_name, image_url, notes],
        (err, result) => {
            if (err) return res.status(500).send("Error saving item");
            res.status(201).json({ message: "Success", item_id: result.insertId });
        }
    );
});

// UPDATE ITEM NOTES (appends a structured comment entry)
router.patch("/:id/notes", (req, res) => {
    const { id } = req.params;
    const { notes } = req.body;
    const currentUserId = req.user?.userId;

    if (!notes || !notes.trim()) {
        return res.status(400).json({ error: "Note text cannot be empty" });
    }

    db.query("SELECT username FROM users WHERE user_id = ?", [currentUserId], (userErr, userResults) => {
        if (userErr) return res.status(500).json({ error: "DB Error" });
        const username = userResults[0]?.username || "Unknown";

        db.query("SELECT notes FROM items WHERE item_id = ?", [id], (err, results) => {
            if (err) return res.status(500).json({ error: "DB Error" });

            const currentNotes = results[0]?.notes || "";
            const parsedNotes = normalizeNotes(currentNotes);
            const newNote = buildNotePayload(notes, username);
            const updatedNotesList = [...parsedNotes, newNote];
            const updatedNotes = JSON.stringify(updatedNotesList);

            db.query(
                "UPDATE items SET notes = ? WHERE item_id = ?",
                [updatedNotes, id],
                (updateErr) => {
                    if (updateErr) return res.status(500).send(updateErr);
                    res.json({ notes: updatedNotes, comments: updatedNotesList });
                }
            );
        });
    });
});

// DELETE A SINGLE ITEM NOTE OR COMMENT
router.delete("/:id/notes", (req, res) => {
    const { id } = req.params;
    const { commentId } = req.body;

    if (!commentId) {
        return res.status(400).json({ error: "commentId is required" });
    }

    db.query("SELECT notes FROM items WHERE item_id = ?", [id], (err, results) => {
        if (err) return res.status(500).json({ error: "DB Error" });

        const currentNotes = results[0]?.notes || "";
        const parsedNotes = normalizeNotes(currentNotes);
        const updatedNotesList = parsedNotes.filter((note) => note.id !== commentId);

        if (updatedNotesList.length === parsedNotes.length) {
            return res.status(404).json({ error: "Comment not found" });
        }

        const updatedNotes = JSON.stringify(updatedNotesList);
        db.query(
            "UPDATE items SET notes = ? WHERE item_id = ?",
            [updatedNotes, id],
            (updateErr) => {
                if (updateErr) return res.status(500).send(updateErr);
                res.json({ notes: updatedNotes, comments: updatedNotesList });
            }
        );
    });
});

const checkWishlistCompletion = (wishlistId, callback) => {
    const sql = `
        SELECT COUNT(*) AS remaining
        FROM items
        WHERE wishlist_id = ?
        AND is_purchased = 0
    `;

    db.query(sql, [wishlistId], (err, results) => {
        if (err) return callback(err);

        const isComplete = results[0].remaining === 0;

        if (!isComplete) {
            return callback(null, false);
        }

        const completeSql = `
            UPDATE wishlists
            SET is_completed = 1,
                completed_at = NOW()
            WHERE wishlist_id = ?
        `;

        db.query(completeSql, [wishlistId], (updateErr) => {
            if (updateErr) return callback(updateErr);

            callback(null, true);
        });
    });
};

// MARK ITEM AS PURCHASED (stores purchase price and timestamp)
router.patch("/:id/purchase", (req, res) => {
    const { id } = req.params;
    const { price } = req.body;
    const currentUserId = req.user.userId;

    const itemSql = `
        SELECT i.*, w.name AS wishlist_name
        FROM items i
        LEFT JOIN wishlists w 
            ON i.wishlist_id = w.wishlist_id
        WHERE i.item_id = ?
        LIMIT 1
    `;

    db.query(itemSql, [id], (err, results) => {
        if (err) return res.status(500).send(err);

        if (!results.length) {
            return res.status(404).send("Item not found");
        }

        const item = results[0];

        // Prevent double purchase
        if (item.is_purchased) {
            return res.status(400).json({
                error: "Item already purchased"
            });
        }

        // Mark item purchased
        const updateSql = `
            UPDATE items
            SET
                is_purchased = 1,
                purchased_at = NOW(),
                purchased_price = ?,
                purchased_by = ?
            WHERE item_id = ?
            AND is_purchased = 0
        `;

           db.query(updateSql, [price, currentUserId, id], (updateErr, updateResult) => {

            if (updateErr) {
                return res.status(500).send(updateErr);
            }

            if (updateResult.affectedRows === 0) {
                return res.status(400).json({
                    error: "Item already purchased"
                });
            }

            // CART ITEM ONLY
            return handleCompletionCheck();

            // Get purchaser username
            db.query(
                "SELECT username FROM users WHERE user_id = ?",
                [currentUserId],
                (userErr, userResults) => {
                    if (userErr) return res.status(500).send(userErr);

                    const purchaserUsername =
                        userResults[0]?.username || "Unknown";

                    // Check if collaborative
                    const collabSql = `
                        SELECT COUNT(*) AS memberCount
                        FROM wishlist_members
                        WHERE wishlist_id = ?
                    `;

                    db.query(
                        collabSql,
                        [item.wishlist_id],
                        (collabErr, collabResults) => {
                            if (collabErr)
                                return res.status(500).send(collabErr);

                            const isCollaborative =
                                collabResults[0].memberCount > 1;

                            // PRIVATE WISHLIST
                            if (!isCollaborative) {
                                return handleCompletionCheck();
                            }

                            // SHARED WISHLIST
                            const message = `${purchaserUsername} purchased "${item.product_name}" from "${item.wishlist_name}".`;
                            const notifySql = `
                                SELECT DISTINCT u.user_id, u.email
                                FROM wishlist_members wm
                                JOIN users u
                                    ON wm.user_id = u.user_id
                                WHERE wm.wishlist_id = ?
                                AND wm.user_id != ?
                            `;

                            db.query(
                                notifySql,
                                [item.wishlist_id, currentUserId],
                                async (notifyErr, users) => {
                                    if (notifyErr)
                                        return res.status(500).send(notifyErr);

                                    // INSERT NOTIFICATIONS
                                    for (const u of users) {

    // Insert notification
    db.query(
        `
        INSERT INTO notifications
        (
            user_id,
            message,
            type,
            reference_id
        )
        VALUES (?, ?, ?, ?)
        `,
        [
            u.user_id,
            message,
            "collaboration_activity",
            item.wishlist_id
        ]
    );

    // Send email
    try {
        await sendEmail({
    to: u.email,
    subject: "Shared Wishlist Purchase",
    text: message,
    html: `
        <div style="background-color:#f9fafb;padding:40px 0;font-family:sans-serif;">
            <div style="max-width:500px;margin:0 auto;background:#ffffff;border-radius:16px;padding:40px;">
                
                <h1 style="font-size:24px;color:#111827;margin-bottom:20px;">
                    🛒 Wishlist Activity
                </h1>

                <p style="font-size:16px;color:#4b5563;line-height:24px;">
                    <strong>${purchaserUsername}</strong> purchased
                    <strong>${item.product_name}</strong>
                    from the wishlist
                    <strong>${item.wishlist_name}</strong>.
                </p>

                <div style="
                    margin-top:24px;
                    padding:16px;
                    background:#fff7ed;
                    border-radius:12px;
                    color:#9a3412;
                    font-weight:600;
                ">
                    Collaborative wishlist updated
                </div>

                <p style="font-size:12px;color:#9ca3af;margin-top:30px;">
                    You're receiving this because you're a collaborator on this wishlist.
                </p>

            </div>
        </div>
    `
});
    } catch (emailErr) {
        console.error("Email error:", emailErr);
    }
}

                                    handleCompletionCheck();
                                }
                            );
                        }
                    );

                    function handleCompletionCheck() {
                        checkWishlistCompletion(
                            item.wishlist_id,
                            (completionErr, completed) => {
                                if (completionErr) {
                                    return res
                                        .status(500)
                                        .send(completionErr);
                                }

                                // Return updated item immediately
                                const updatedItemSql = `
                                    SELECT i.*, u.username AS purchased_by_username
                                    FROM items i
                                    LEFT JOIN users u
                                        ON i.purchased_by = u.user_id
                                    WHERE i.item_id = ?
                                `;

                                db.query(
                                    updatedItemSql,
                                    [id],
                                    (finalErr, finalResults) => {
                                        if (finalErr)
                                            return res
                                                .status(500)
                                                .send(finalErr);

                                        res.status(200).json({
                                            success: true,
                                            completed,
                                            item: finalResults[0]
                                        });
                                    }
                                );
                            }
                        );
                    }
                }
            );
        });
    });
});

// GET PRICE HISTORY FOR ITEM (used for analytics charts)
router.get("/:id/history", (req, res) => {
    const { id } = req.params;

    const sql = `
        SELECT price, DATE_FORMAT(recorded_at, '%b %d') as date 
        FROM price_history 
        WHERE item_id = ? 
        ORDER BY recorded_at ASC
    `;

    db.query(sql, [id], (err, results) => {
        if (err) return res.status(500).send("Database error: " + err.message);
        res.json(results);
    });
});

// GET ITEMS VIA PUBLIC SHARE LINK (no authentication required)
router.get("/public/:share_token", (req, res) => {
    const { share_token } = req.params;

    const sql = `
        SELECT i.*, u.username
        FROM items i
        JOIN users u ON i.user_id = u.user_id
        WHERE u.share_token = ? 
        AND i.is_purchased = 0
        ORDER BY i.updated_at DESC
    `;

    db.query(sql, [share_token], (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        if (results.length === 0)
            return res.status(404).json({ error: "Cart not found or empty" });

        res.json(results);
    });
});

// BULK DELETE ITEMS
router.delete("/bulk", (req, res) => {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).send("No item IDs provided");
    }

    const sql = "DELETE FROM items WHERE item_id IN (?)";

    db.query(sql, [ids], (err, result) => {
        if (err) {
            console.error("Bulk delete error:", err);
            return res.status(500).send("Database error during deletion");
        }

        res.status(200).json({
            message: `Successfully deleted ${result.affectedRows} items`
        });
    });
});

// BULK MOVE ITEMS TO WISHLIST
router.patch("/bulk-move", (req, res) => {
    const { ids, wishlist_id } = req.body;

    const sql = "UPDATE items SET wishlist_id = ? WHERE item_id IN (?)";

    db.query(sql, [wishlist_id, ids], (err) => {
        if (err) return res.status(500).send(err);
        res.status(200).json({ message: "Items moved successfully" });
    });
});

module.exports = router;