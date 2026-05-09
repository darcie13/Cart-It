/**
 * Authentication Routes: Handles user authentication and account management.
 * Features:
 * - User signup
 * - User login with JWT
 * - Password reset (request + update)
 */

const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const crypto = require('crypto');

const sendEmail = require("../utils/send-emails"); 

/* SIGN UP: Creates a new user with hashed password and unique share token */
router.post("/signup", async (req, res) => {
    const { username, email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const shareToken = require('crypto')
        .randomBytes(16)
        .toString('hex');

    const sql = `
        INSERT INTO users 
        (username, email, password_hash, share_token) 
        VALUES (?, ?, ?, ?)
    `;
    
    db.query(sql, [username, email, hashedPassword, shareToken], (err, result) => {
        if (err) {
            /* Handle duplicate email */
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).send("This email is already registered.");
            }

            return res.status(400).send("Error creating user: " + err.message);
        }

        res.status(201).send("User registered successfully");
    });
});


/* LOGIN: Authenticates user and returns JWT token */
router.post("/login", (req, res) => {
    const { email, password } = req.body;

    const sql = "SELECT * FROM users WHERE email = ?";

    db.query(sql, [email], async (err, results) => {
        if (err || results.length === 0) {
            return res.status(401).send("User not found");
        }

        const user = results[0];

        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).send("Invalid password");
        }

        /* Generate JWT token */
        const token = jwt.sign(
            { userId: user.user_id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({
            token,
            user: {
                user_id: user.user_id,
                username: user.username,
                email: user.email,
                share_token: user.share_token
            }
        });
    });
});


/* REQUEST PASSWORD RESET: Generates reset token and emails user */
router.post("/forgot-password", async (req, res) => {
    const { email } = req.body;

    const sql = "SELECT user_id, username FROM users WHERE email = ?";
  
    db.query(sql, [email], (err, results) => {
        if (err || results.length === 0) {
            return res.status(200).send("If an account exists, a reset link has been sent.");
        }

        const user = results[0];

        /* Generate secure reset token */
        const token = crypto.randomBytes(32).toString('hex');

        const expires = new Date(Date.now() + 3600000);

        const updateSql = `
            UPDATE users 
            SET reset_token = ?, reset_expires = ? 
            WHERE user_id = ?
        `;

        db.query(updateSql, [token, expires, user.user_id], async (err) => {
            if (err) return res.status(500).send("Database error");

            /* Send reset email*/
            await sendEmail({
                to: email,
                subject: "Reset Your Cart-It Password",
                html: `
                    <div style="background-color: #f9fafb; padding: 40px 0; font-family: sans-serif;">
                        <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; padding: 40px; text-align: center;">
                            <h1 style="color: #111827; font-size: 24px;">Password Reset Request</h1>
                            <p style="color: #4b5563; font-size: 16px; line-height: 24px;">
                                Hi <strong>${user.username}</strong>, we received a request to reset your password. 
                                Click the button below to choose a new one. This link expires in 1 hour.
                            </p>
                            <a href="https://cart-it.app/reset-password/${token}" 
                               style="display: inline-block; background-color: #DB8046; color: #ffffff; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: bold; margin-top: 20px;">
                                Reset Password
                            </a>
                            <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">
                                If you didn't request this, you can safely ignore this email.
                            </p>
                        </div>
                    </div>
                `
            });

            res.status(200).send("Reset link sent.");
        });
    });
});


/* RESET PASSWORD: Validates token and updates password */
router.post("/reset-password", async (req, res) => {
    const { token, newPassword } = req.body;

    const sql = `
        SELECT user_id 
        FROM users 
        WHERE reset_token = ? 
        AND reset_expires > NOW()
    `;

    db.query(sql, [token], async (err, results) => {
        if (err || results.length === 0) {
            return res.status(400).send("Token invalid or expired.");
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const updateSql = `
            UPDATE users 
            SET password_hash = ?, reset_token = NULL, reset_expires = NULL 
            WHERE user_id = ?
        `;
        
        db.query(updateSql, [hashedPassword, results[0].user_id], (err) => {
            if (err) return res.status(500).send("Error updating password.");

            res.status(200).send("Password updated successfully.");
        });
    });
});

module.exports = router;