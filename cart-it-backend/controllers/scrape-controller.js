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

/* Utility function to sanitize and convert price strings to numbers */
const sanitizePrice = (rawPrice) => {
    if (!rawPrice) return 0.00;

    const cleaned = String(rawPrice).replace(/,/g, "");

    const match = cleaned.match(/\d+(\.\d{1,2})?/);

    return match ? Number(match[0]) : 0.00;
};


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
            data.price = sanitizePrice(data.price);
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
    console.log("SCRAPE REQUEST BODY:", req.body);
    console.log("[SCRAPE] Incoming request");
    console.log("[SCRAPE] URL:", url);
    console.log("[SCRAPE] Has extension data:", !!productData);

    try {
        let data;

        /* Priority: Using extension provided data */
      if (productData && productData.name) {
        console.log("[Cart-It] Using extension-provided data");
        let store = null;

        try {
            if (url) {
                store = new URL(url).hostname;
            }
        } catch (e) {
            console.error("Invalid URL received:", url);
            store = null;
        }

        data = {
        name: productData.name,
        price: sanitizePrice(productData.price),
        img: productData.img,
        store: store
        };

        } else {
            /* Fallback: scraping using backend providers */
            console.log("[Cart-It] Falling back to scraping...");

            const result = await scrapeWithFailover(url);

            if (result.provider === "AI") {
                data = result.data;
                data.price = sanitizePrice(data.price);
            } else {
                data = parseProductData(result.html, url);
                data.price = sanitizePrice(data.price);
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

        console.log("[SCRAPE] Final data being saved:", data);
        console.log("[SCRAPE] Wishlist ID:", wishlist_id);
        console.log("[SCRAPE] User ID:", user_id);
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
                if (err) {
                    console.error("[DB ERROR - INSERT ITEM]", err);
                    return res.status(500).json({ error: err.message });
                }

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