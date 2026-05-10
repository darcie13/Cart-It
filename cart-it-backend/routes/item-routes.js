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

const requireUserId = (req, res) => {
    const userId = req.user?.userId;
    if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return null;
    }
    return userId;
};

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
    const currentUserId = requireUserId(req, res);
    if (!currentUserId) return;

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
    const currentUserId = requireUserId(req, res);
    if (!currentUserId) return;

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

// PURCHASE FLOW HELPERS
const getItemById = (id) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT i.*, w.name AS wishlist_name
            FROM items i
            LEFT JOIN wishlists w ON i.wishlist_id = w.wishlist_id
            WHERE i.item_id = ?
            LIMIT 1
        `;
        db.query(sql, [id], (err, results) => {
            if (err) return reject(err);
            resolve(results[0]);
        });
    });
};

const markItemAsPurchased = (id, price, userId) => {
    return new Promise((resolve, reject) => {
        const sql = `
            UPDATE items
            SET is_purchased = 1,
                purchased_at = NOW(),
                purchased_price = ?,
                purchased_by = ?
            WHERE item_id = ?
            AND is_purchased = 0
        `;
        db.query(sql, [price, userId, id], (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
};

const getUsername = (userId) => {
    return new Promise((resolve, reject) => {
        db.query(
            "SELECT username FROM users WHERE user_id = ?",
            [userId],
            (err, results) => {
                if (err) return reject(err);
                resolve(results[0]?.username || "Unknown");
            }
        );
    });
};

const isCollaborativeWishlist = (wishlistId) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT COUNT(*) AS memberCount
            FROM wishlist_members
            WHERE wishlist_id = ?
        `;
        db.query(sql, [wishlistId], (err, results) => {
            if (err) return reject(err);
            resolve(results[0].memberCount > 1);
        });
    });
};

const notifyCollaborators = async (item, purchaserUsername, currentUserId) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT DISTINCT u.user_id, u.email
            FROM wishlist_members wm
            JOIN users u ON wm.user_id = u.user_id
            WHERE wm.wishlist_id = ?
            AND wm.user_id != ?
        `;

        db.query(sql, [item.wishlist_id, currentUserId], async (err, users) => {
            if (err) return reject(err);

            const message = `${purchaserUsername} purchased "${item.product_name}" from "${item.wishlist_name}".`;

            for (const u of users) {
                db.query(
                    `INSERT INTO notifications (user_id, message, type, reference_id)
                     VALUES (?, ?, ?, ?)`,
                    [u.user_id, message, "collaboration_activity", item.wishlist_id]
                );

                try {
                    await sendEmail({
                        to: u.email,
                        subject: "Shared Wishlist Purchase",
                        text: message,
                        html: `<p>${message}</p>`
                    });
                } catch (e) {
                    console.error("Email error:", e);
                }
            }

            resolve();
        });
    });
};

const checkAndFinalizeCompletion = (wishlistId) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT COUNT(*) AS remaining
            FROM items
            WHERE wishlist_id = ?
            AND is_purchased = 0
        `;

        db.query(sql, [wishlistId], (err, results) => {
            if (err) return reject(err);

            const completed = results[0].remaining === 0;

            if (!completed) return resolve(false);

            db.query(
                `UPDATE wishlists
                 SET is_completed = 1,
                     completed_at = NOW()
                 WHERE wishlist_id = ?`,
                [wishlistId],
                (err2) => {
                    if (err2) return reject(err2);
                    resolve(true);
                }
            );
        });
    });
};

// FIXED PURCHASE ROUTE 
router.patch("/:id/purchase", async (req, res) => {
    const { id } = req.params;
    const { price } = req.body;
    const currentUserId = requireUserId(req, res);
    if (!currentUserId) return;

    try {
        const item = await getItemById(id);

        if (!item) {
            return res.status(404).json({ error: "Item not found" });
        }

        if (item.is_purchased) {
            return res.status(400).json({ error: "Item already purchased" });
        }

        const updateResult = await markItemAsPurchased(id, price, currentUserId);

        if (updateResult.affectedRows === 0) {
            return res.status(400).json({ error: "Item already purchased" });
        }

        const purchaserUsername = await getUsername(currentUserId);

        const collaborative = await isCollaborativeWishlist(item.wishlist_id);

        let completed = false;

        if (!collaborative) {
            completed = await checkAndFinalizeCompletion(item.wishlist_id);
        } else {
            await notifyCollaborators(item, purchaserUsername, currentUserId);
            completed = await checkAndFinalizeCompletion(item.wishlist_id);
        }

        const updatedItem = await new Promise((resolve, reject) => {
            db.query(
                `SELECT i.*, u.username AS purchased_by_username
                 FROM items i
                 LEFT JOIN users u ON i.purchased_by = u.user_id
                 WHERE i.item_id = ?`,
                [id],
                (err, results) => {
                    if (err) return reject(err);
                    resolve(results[0]);
                }
            );
        });

        return res.status(200).json({
            success: true,
            completed,
            item: updatedItem
        });

    } catch (err) {
        console.error("Purchase error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
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