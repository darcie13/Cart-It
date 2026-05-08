/** 
* SCRAPER ENGINE 
* Responsible for attempting multiple scraping providers with fallback logic
* Includes validation, HTML parsing, and AI fallback extraction when all providers fail
*/

const axios = require('axios');
const cheerio = require('cheerio');

// MAIN FAILOVER PIPELINE
// Tries multiple scraping providers in order until valid product data is found
const scrapeWithFailover = async (url) => {
    const providers = [
        {
            name: 'ScraperAPI',
            getUrl: (t) =>
                `https://api.scraperapi.com/?api_key=${process.env.SCRAPERAPI_KEY}&url=${encodeURIComponent(t)}&render=true`
        },
        {
            name: 'ScrapingBee',
            getUrl: (t) =>
                `https://app.scrapingbee.com/api/v1/?api_key=${process.env.SCRAPINGBEE_API_KEY}&url=${encodeURIComponent(t)}&render_js=true&premium_proxy=true&wait=3000`
        }
    ];

    for (const p of providers) {
        try {
            console.log(`[Cart-It] Trying ${p.name}`);
            const res = await axios.get(p.getUrl(url), { timeout: 20000 });
            const parsed = parseProductData(res.data, url);

            if (isValidProduct(parsed)) {
                return {
                    html: res.data,
                    provider: p.name
                };
            }
        } catch (err) {
            console.log(`[Cart-It] ${p.name} failed:`, err.message);
        }
    }

    // Fallback to Scrapebadger (POST)
    console.log("[Cart-It] Trying ScrapeBadger (POST)");

    try {
        const res = await axios.post(
            "https://scrapebadger.com/v1/web/scrape",
            {
                url,
                format: "html"
            },
            {
                headers: {
                    "X-API-Key": process.env.SCRAPEBADGER_API_KEY,
                    "Content-Type": "application/json"
                },
                timeout: 10000
            }
        );

        const parsed = parseProductData(res.data.content, url);

        if (isValidProduct(parsed)) {
            return {
                html: res.data.content,
                provider: "ScrapeBadger"
            };
        }
    } catch (err) {
        console.log("[Cart-It] ScrapeBadger failed:", err.message);
    }

    // AI FALLBACK (last resort)
    try {
        console.warn("[Cart-It] AI fallback triggered");

        const aiData = await scrapeWithAI(url);

        if (isValidProduct(aiData)) {
            return {
                html: null,
                provider: "AI",
                data: aiData
            };
        }
    } catch (err) {
        console.error("[Cart-It] AI failed:", err.message);
    }

    throw new Error("All scraping methods failed.");
};

// PRODUCT VALIDATION
// Filters out bot pages, blocked responses, and invalid products
const isValidProduct = (d) => {
    if (!d) return false;

    const badNames = [
        "product undetected",
        "unknown",
        "robot check",
        "adding to cart",
        "bot check"
    ];

    const nameOk =
        d.name &&
        !badNames.some(b => d.name.toLowerCase().includes(b));

    const imgOk = !!d.img;

    const priceOk =
        d.price !== null &&
        d.price !== undefined &&
        d.price !== "0.00";

    // Price is optional due to anti-bot restrictions on some sites
    return nameOk && imgOk;
};

// HTML PRODUCT PARSER
// Extracts product data from structured data, meta tags, and site-specific rules
const parseProductData = (html, url) => {
    const $ = cheerio.load(html);
    const host = new URL(url).hostname;

    let data = {
        name: null,
        price: null,
        img: null,
        store: host
    };

    // 1. JSON-LD structured data (best source if available)
    $('script[type="application/ld+json"]').each((_, el) => {
        try {
            const json = JSON.parse($(el).text());
            const item = Array.isArray(json) ? json[0] : json;

            const product = item?.["@graph"]
                ? item["@graph"].find(g => g["@type"] === "Product")
                : item;

            if (product) {
                data.name = product.name || data.name;
                data.img =
                    typeof product.image === 'string'
                        ? product.image
                        : product.image?.[0] || data.img;

                const offer = product.offers;
                data.price =
                    offer?.price ||
                    offer?.[0]?.price ||
                    data.price;
            }
        } catch {}
    });

    // 2. Meta tag fallback extraction
    data.name =
        data.name ||
        $('meta[property="og:title"]').attr('content') ||
        $('h1').first().text().trim();

    data.img =
        data.img ||
        $('meta[property="og:image"]').attr('content') ||
        $('img').first().attr('src');

    // 3. Site-specific parsing rules

    // Amazon parsing
    if (host.includes("amazon")) {
        const priceSelectors = [
            '.a-price .a-offscreen',
            '#corePriceDisplay_desktop_feature_div .a-offscreen',
            '#priceblock_ourprice',
            '#priceblock_dealprice'
        ];

        for (const sel of priceSelectors) {
            const text = $(sel).first().text()?.trim();
            const match = text?.replace(/[^\d.]/g, '');
            if (match) {
                data.price = match;
                break;
            }
        }
    }

    // Target parsing
    if (host.includes("target")) {
        data.name =
            data.name ||
            $('h1').first().text().trim() ||
            $('[data-test="product-title"]').text().trim();

        data.img =
            data.img ||
            $('img').first().attr('src');

        const raw = $('[data-test="product-price"]').text();
        const match = raw?.replace(/[^\d.]/g, '');
        data.price = match || data.price;
    }

    // eBay parsing
    if (host.includes("ebay")) {
        const raw =
            $('.x-price-primary').text() ||
            $('#prcIsum').text();

        const match = raw?.replace(/[^\d.]/g, '');
        data.price = match || data.price;
    }

    return data;
};

// AI SCRAPING FALLBACK (SCRAPEBADGER)
// Uses external API to extract structured product data when scraping fails
const scrapeWithAI = async (url) => {
    const res = await axios.post(
        "https://scrapebadger.com/v1/web/scrape",
        {
            url,
            ai_extract: true,
            ai_prompt: "Extract the product name, price, and main image URL as JSON with keys: product_name, price, image_url"
        },
        {
            headers: {
                "X-API-Key": process.env.SCRAPEBADGER_API_KEY
            }
        }
    );
    if (!res.data.success || !res.data.ai_extraction) {
        throw new Error('Failed to extract product data');
    }
    return {
        name: res.data.ai_extraction.product_name,
        price: res.data.ai_extraction.price,
        img: res.data.ai_extraction.image_url
    };
};

module.exports = {
    scrapeWithFailover,
    parseProductData
};