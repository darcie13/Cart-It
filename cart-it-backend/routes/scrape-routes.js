/**
 * Scrape Routes
 * Handles product scraping operations including:
 * - preview scraping (test scrape without saving)
 * - scrape and save (final item creation flow)
 * - authentication-protected scraping endpoints
 */

const express = require("express");
const router = express.Router();

const scrapeController = require("../controllers/scrape-controller");
const auth = require("../middleware/auth");

// Optional validation middleware to ensure URL exists in request body
const validateUrl = (req, res, next) => {
    if (!req.body.url) {
        return res.status(400).json({ error: "URL is required" });
    }
    try {
        new URL(req.body.url);
    } catch {
        return res.status(400).json({ error: "Invalid URL format" });
    }
    next();
};

// PREVIEW SCRAPE (authenticated) - returns scraped product data without saving
router.post(
    "/preview-scrape",
    auth,
    validateUrl,
    scrapeController.previewScrape
);

// SCRAPE AND SAVE (authenticated) - scrapes product and stores it in database
router.post(
    "/scrape-and-save",
    auth,
    validateUrl,
    scrapeController.scrapeAndSave
);

module.exports = router;