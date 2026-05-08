/**
 * Analytics Routes: Provides aggregated analytics data for a user based on a selected timeframe.
 * Returns:
 * - Total spending
 * - Spending breakdown by retailer
 * - Spending breakdown by category
 * Timeframes supported:
 * - week (default)
 * - month
 * - year
 */

const express = require("express");
const router = express.Router();
const db = require("../config/db");

/* GET /api/analytics
 * Query params: userId: ID of the user & timeframe: 'week' | 'month' | 'year'
 */
router.get("/", (req, res) => {
    const { timeframe, userId } = req.query;
    
    /* Convert timeframe into SQL interval */
    const intervalMap = {
        week: '7 DAY',
        month: '1 MONTH',
        year: '1 YEAR'
    };

    const interval = intervalMap[timeframe] || '7 DAY';

    /* Query 1: Total spending */
    const qTotal = `
        SELECT SUM(purchased_price) as total 
        FROM items 
        WHERE user_id = ? 
        AND is_purchased = 1 
        AND purchased_at >= DATE_SUB(NOW(), INTERVAL ${interval})
    `;
    
    /* Query 2: Spending by retailer */
    const qRetailer = `
        SELECT store_name as name, SUM(purchased_price) as value 
        FROM items 
        WHERE user_id = ? 
        AND is_purchased = 1 
        AND purchased_at >= DATE_SUB(NOW(), INTERVAL ${interval}) 
        GROUP BY store_name 
        ORDER BY value DESC
    `;
    
    /* Query 3: Spending by category */
    const qCategory = `
        SELECT category as name, SUM(purchased_price) as value 
        FROM items 
        WHERE user_id = ? 
        AND is_purchased = 1 
        AND purchased_at >= DATE_SUB(NOW(), INTERVAL ${interval}) 
        GROUP BY category 
        ORDER BY value DESC
    `;

    /* Execute queries sequentially */
    db.query(qTotal, [userId], (err, totalRes) => {
        if (err) return res.status(500).json({ error: err.message });

        db.query(qRetailer, [userId], (err, retailerRes) => {
            if (err) return res.status(500).json({ error: err.message });

            db.query(qCategory, [userId], (err, categoryRes) => {
                if (err) return res.status(500).json({ error: err.message });

                /* Format retailer results */
                const formattedRetailers = retailerRes.map(row => ({
                    name: row.name || 'Unknown',
                    value: parseFloat(row.value) || 0
                }));

                /* Format category results */
                const formattedCategories = categoryRes.map(row => ({
                    name: row.name || 'General',
                    value: parseFloat(row.value) || 0
                }));

                /* Send combined analytics response */
                res.json({
                    total: parseFloat(totalRes[0]?.total) || 0,
                    byRetailer: formattedRetailers,
                    byCategory: formattedCategories
                });
            });
        });
    });
});

module.exports = router;