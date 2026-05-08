/**
 * Notification Routes
 * Handles user notifications including:
 * - fetching latest notifications
 * - marking single notifications as read
 * - marking all notifications as read
 */

const express = require("express");
const router = express.Router();
const db = require("../config/db");

// GET notifications (supports filtering)
router.get("/:userId", async (req, res) => {
    const { userId } = req.params;
    const { type } = req.query; // 👈 ADD THIS

    try {
        let query = `
            SELECT * FROM notifications
            WHERE user_id = ?
        `;

        const params = [userId];

        // Optional filter support
        if (type && type !== "all") {
            query += " AND type = ?";
            params.push(type);
        }

        query += " ORDER BY created_at DESC, notification_id DESC LIMIT 10";

        const [rows] = await db.promise().execute(query, params);

        return res.json(rows);
    } catch (err) {
        console.error("Failed to fetch notifications:", err);
        return res.status(500).json({ error: "Failed to fetch notifications" });
    }
});

// MARK SINGLE NOTIFICATION AS READ
router.patch("/:id/read", async (req, res) => {
    try {
        const { id } = req.params;

        await db.execute(
            `UPDATE notifications 
             SET is_read = 1 
             WHERE notification_id = ?`,
            [id]
        );

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Failed to update notification" });
    }
});

// MARK ALL NOTIFICATIONS AS READ FOR USER
router.patch("/read-all", async (req, res) => {
    try {
        const { user_id } = req.body;

        if (!user_id) {
            return res.status(400).json({ error: "Missing user_id" });
        }

        await db.execute(
            `UPDATE notifications 
             SET is_read = 1 
             WHERE user_id = ? AND is_read = 0`,
            [user_id]
        );

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Failed to update notifications" });
    }
});

module.exports = router;