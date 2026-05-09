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
app.use(cors());

app.get('/', (req, res) => {
  res.send('Cart-It backend is running');
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
  // If the URL contains "public", skip the token check
  if (req.path.includes('/public/')) return next();
  return authenticateToken(req, res, next);
}, itemRoutes);

app.use("/api/wishlists", (req, res, next) => {
  // If URL contains "public", skip token check
  if (req.path.includes('/public/')) return next();
  return authenticateToken(req, res, next);
}, wishlistRoutes);

app.use("/api/notifications", notificationsRoutes);

// Protected Routes
app.use("/api/scrape", authenticateToken, scrapeRoutes);
app.use("/api/analytics", authenticateToken, analyticsRoutes);

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));