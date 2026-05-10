/**
 * Price Tracker Cron Job
 * This job runs on a schedule (daily at midnight) to:
 * - Check current prices of all tracked items
 * - Update item prices if they have changed
 * - Store price history for tracking
 * - Create notifications for price drops
 * - Send email alerts to users for price drops
 */

const { CronJob } = require('cron');
const db = require('../config/db');
const sendEmail = require('../utils/send-emails');
const { scrapeWithFailover } = require('../utils/scraper-engine');

/**
 * Main price checking logic
 * Iterates through all trackable items and processes updates
 */
const runPriceCheck = async () => {
    console.log("[PriceTracker] Running price check...");

    try {
        /**
         * 1. Fetch all items that should be tracked
         * Includes user email for notifications
         */
        const [items] = await db.promise().execute(`
            SELECT i.*, u.email as user_email
            FROM items i
            JOIN users u ON i.user_id = u.user_id
            WHERE i.track_price = 1 AND i.is_purchased = 0
        `);

        console.log(`[PriceTracker] Found ${items.length} items to check`);

        /* 2. Loop through each item and check price */
        for (const item of items) {
            try {
                console.log(`[PriceTracker] Checking: ${item.product_name} (${item.product_url})`);

                /* Validate existing price */
                const oldPrice = parseFloat(item.price);
                if (!Number.isFinite(oldPrice) || oldPrice <= 0) {
                    console.warn(`[PriceTracker] Skipping item ${item.item_id} due to invalid current price: ${item.price}`);
                    continue;
                }

                /* Scrape latest price */
                const scrapeResult = await scrapeWithFailover(item.product_url);

                let scrapedData;

                if (scrapeResult.provider === "AI") {
                    scrapedData = scrapeResult.data;
                } else {
                    scrapedData = require('../utils/scraper-engine')
                    .parseProductData(scrapeResult.html, item.product_url);
                }

                const newPrice = parseFloat(scrapedData.price);

                if (!Number.isFinite(newPrice) || newPrice <= 0) {
                    console.warn(`[PriceTracker] Could not determine a valid price for item ${item.item_id}`);
                    continue;
                }

                console.log(`[PriceTracker] Price: ${oldPrice} -> ${newPrice}`);

                /* 3. If price changed, update database and log history */
                if (newPrice !== oldPrice) {
                    await db.promise().execute(`
                        INSERT INTO price_history (item_id, price)
                        VALUES (?, ?)
                    `, [item.item_id, newPrice]);

                    await db.promise().execute(`
                        UPDATE items
                        SET price = ?, updated_at = NOW()
                        WHERE item_id = ?
                    `, [newPrice, item.item_id]);
                }

                /* 4. If price dropped, create notification and send email */
                if (newPrice < oldPrice) {
                    const drop = (oldPrice - newPrice).toFixed(2);

                    const message = `
                        \uD83D\uDCC9 PRICE DROP ALERT!
                        ${item.product_name} is now $${newPrice}
                        Previously: $${oldPrice} • You saved: $${drop}
                    `;

                    /* Insert notification into database*/
                    const [insertResult] = await db.promise().execute(`
                        INSERT INTO notifications (
                        user_id,
                        message,
                        email_sent,
                        type
                        )
                        VALUES (?, ?, 0, ?)
                    `, [item.user_id, message, "price_drop"]);

                    const notificationId = insertResult.insertId;

                    console.log(`[PriceTracker] Created notification for ${item.product_name} (id=${notificationId})`);

                    /* Send email notification */
                    try {
                        await sendEmail({
                            to: item.user_email,
                            subject: `Price Drop Alert: ${item.product_name}`,
                            text: message.trim()
                        });

                        /* Mark notification as emailed */
                        await db.promise().execute(
                            `UPDATE notifications SET email_sent = 1 WHERE notification_id = ?`,
                            [notificationId]
                        );

                        console.log(`[Email] marked notification ${notificationId} as sent`);

                    } catch (emailErr) {
                        console.error(`[Email] failed for notification ${notificationId}:`, emailErr.message);
                    }
                }

            } catch (err) {
                console.error("[PriceTracker] Item failed:", item.item_id, err.message);
            }
        }

    } catch (err) {
        console.error("[PriceTracker] Job failed:", err.message);
    }
};


/* Cron schedule configuration. Runs once per day at midnight */
const job = new CronJob('0 0 * * *', runPriceCheck);
job.start();

module.exports = runPriceCheck;