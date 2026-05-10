/**
 * Main Server File 
 * This file initializes the Express server and configures the backend API.
 * Responsibilities include:
 * - Loading environment variables
 * - Setting up middleware (CORS, JSON parsing)
 * - Registering all route handlers
 * - Applying authentication middleware where required
 * - Starting background jobs (price tracking system)
 * - Launching the backend server on port 3000
 */

require('dotenv').config();
const express = require("express");
const cors = require("cors");
const app = express();

app.use(express.json());
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://cart-it.app",
  "https://cart-it-pink.vercel.app",
  "https://cart-it-aflx.onrender.com",
  "chrome-extension://objilaloanbgdonaepejdfeahohkknhe"
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// Health check endpoint
app.get('/', (req, res) => {
  res.send('Cart-It backend is running');
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Route Imports
const authRoutes = require("./routes/auth-routes");
const wishlistRoutes = require("./routes/wishlist-routes");
const itemRoutes = require("./routes/item-routes");
const scrapeRoutes = require("./routes/scrape-routes");
const analyticsRoutes = require("./routes/analytics-routes");
const notificationsRoutes = require("./routes/notifications-routes");
const authenticateToken = require("./middleware/auth");

// Start the price tracker job
require("./jobs/price-tracker-job");

// Public Route
app.use("/api/auth", authRoutes);

app.use("/api/items", (req, res, next) => {
  if (req.originalUrl.includes('/public/')) return next();
  return authenticateToken(req, res, next);
}, itemRoutes);

app.use("/api/wishlists", (req, res, next) => {
  if (req.originalUrl.includes('/public/')) return next();
  return authenticateToken(req, res, next);
}, wishlistRoutes);

app.use("/api/notifications", notificationsRoutes);

// Protected Routes
app.use("/api/scrape", authenticateToken, scrapeRoutes);
app.use("/api/analytics", authenticateToken, analyticsRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));