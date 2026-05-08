/**
 * Database Configuration (MySQL Connection Pool)
 * This file initializes and exports a reusable MySQL connection pool using mysql2.
 * The pool allows efficient handling of multiple database queries by reusing connections
 * instead of opening a new one for every request.
 */

const mysql = require("mysql2");
require('dotenv').config();


const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test the database connection on startup
db.getConnection((err, connection) => {
    if (err) {
        console.error("Database connection failed:", err.message);
    } else {
        console.log("Successfully connected to MySQL:", process.env.DB_NAME);
        connection.release();
    }
});

module.exports = db;