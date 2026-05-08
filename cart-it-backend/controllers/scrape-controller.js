/**
 * Scrape Controller
 * Handles product scraping and saving logic for the application.
 * Responsibilities:
 * - Preview scraped product data before saving
 * - Save product data to the database
 * - Use extension-provided data when available (preferred)
 * - Fall back to backend scraping if needed
 * - Store price history for tracking
 */

const db = require('../config/db');
const { scrapeWithFailover, parseProductData } = require('../utils/scraper-engine');


/* PREVIEW SCRAPE: Scrapes product data from a URL and returns it without saving.
 * Supports AI-based scraping fallback.
 */
exports.previewScrape = async (req, res) => {
    try {
        const result = await scrapeWithFailover(req.body.url);

        let data;

        // If AI handled extraction, use its structured data directly
        if (result.provider === "AI") {
            data = result.data;
        } else {
            // Otherwise parse raw HTML
            data = parseProductData(result.html, req.body.url);
        }

        // Return scraped data + which provider was used
        res.json({
            ...data,
            providerUsed: result.provider
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


/* SCRAPE + SAVE ITEM: Saves a product to the database.
 * Priority:
 * 1. Use browser extension data (most reliable)
 * 2. Fallback to backend scraping
 */
exports.scrapeAndSave = async (req, res) => {
    const { url, user_id, wishlist_id, notes, productData } = req.body;

    try {
        let data;

        /* Priority: Using extension provided data */
        if (productData && productData.name) {
            console.log("[Cart-It] Using extension-provided data");

            data = {
                name: productData.name,
                price: parseFloat(
                    String(productData.price || "").replace(/[^\d.]/g, "")
                ) || 0.00,
                img: productData.img,
                store: new URL(url).hostname
            };

        } else {
            /* Fallback: scraping using backend providers */
            console.log("[Cart-It] Falling back to scraping...");

            const result = await scrapeWithFailover(url);

            if (result.provider === "AI") {
                data = result.data;
            } else {
                data = parseProductData(result.html, url);
            }
        }

        /* Safety Checks: Ensure required fields exist before saving */
        if (!data.name) {
            data.name = "Unknown Product";
        }

        if (!data.img) {
            data.img = null;
        }

        /* Format notes with timestamp: Matches frontend item modal formatting */
        let formattedNotes = null;

        if (notes && notes.trim()) {
            const timestamp = new Date().toLocaleDateString(); // e.g., "5/3/2026"
            formattedNotes = `[${timestamp}]: ${notes.trim()}`;
        }

        /* INSERT ITEM INTO DATABASE */
        const itemSql = `
            INSERT INTO items 
            (user_id, wishlist_id, product_name, price, product_url, store_name, image_url, notes, track_price) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
        `;

        db.query(
            itemSql,
            [
                user_id,
                wishlist_id,
                data.name,
                data.price,
                url,
                data.store,
                data.img,
                formattedNotes
            ],
            (err, result) => {
                if (err) return res.status(500).json({ error: err.message });

                const itemId = result.insertId;

                /* INSERT INITIAL PRICE INTO HISTORY: Enables price tracking over time */
                const historySql = `
                    INSERT INTO price_history (item_id, price) 
                    VALUES (?, ?)
                `;

                db.query(historySql, [itemId, data.price], (hErr) => {
                    if (hErr) {
                        console.error("Initial price history failed:", hErr.message);
                    }

                    res.status(201).json({
                        message: "Success",
                        item_id: itemId
                    });
                });
            }
        );

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};