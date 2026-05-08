/**
 * Authentication Middleware: Verifies JWT tokens for protected routes.
 * Responsibilities:
 * - Extract token from Authorization header
 * - Validate token using JWT secret
 * - Attach decoded user data to request object
 * - Block access if token is missing or invalid
 */

const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    /* Expect header format: Authorization: Bearer <token> */
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    /* Reject request if no token is provided */
    if (!token) {
        return res.status(401).send("Access Denied: No Token Provided");
    }

    try {
        /* Verify token using secret key */
        const verified = jwt.verify(token, process.env.JWT_SECRET);

        /**
         * Attach decoded payload (userId) to request
         * so downstream routes can access it
         */
        req.user = verified;

        /* Continue to next middleware or route handler */
        next();

    } catch (err) {
        /* Token is invalid or expired */
        res.status(403).send("Invalid Token");
    }
};