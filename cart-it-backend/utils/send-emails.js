// Email utility for Cart-It
// Sends transactional emails using SMTP2GO API (invites, alerts, resets, etc.)

const axios = require('axios');

// Sends an email using SMTP2GO API
// Accepts recipient, subject, and HTML body
const sendEmail = async ({ to, subject, html }) => {
    try {
        if (!to || !subject || !html) {
            throw new Error("Missing email fields: to, subject, or html");
        }

        const response = await axios.post('https://api.smtp2go.com/v3/email/send', {
            api_key: process.env.SMTP2GO_API_KEY,
            to: [to],
            sender: process.env.EMAIL_SENDER || "Cart-It <noreply@cart-it.app>",
            subject,
            html_body: html
        });

        if (process.env.NODE_ENV !== "production") {
            console.log("[Email RESPONSE]:", response.data);
        }

        return response.data;

    } catch (err) {
        console.error("[Email] failed:", err.response?.data || err.message);
        throw err;
    }
};

module.exports = sendEmail;