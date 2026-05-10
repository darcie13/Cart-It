// Email utility for Cart-It
// Sends transactional emails using SMTP2GO API (invites, alerts, resets, etc.)

const axios = require('axios');

// Sends an email using SMTP2GO API
// Accepts recipient, subject, and HTML body
const sendEmail = async ({ to, subject, html, text }) => {
    try {
        if (!to || !subject || !html && !text) {
            throw new Error("Missing email fields");
        }
        const payload = {
            api_key: process.env.SMTP2GO_API_KEY,
            to: [to],
            sender: process.env.EMAIL_SENDER || "Cart-It <noreply@cart-it.app>",
            subject
        };

        // Support either html or plain text
        if (html) {
            payload.html_body = html;
        }

        if (text) {
            payload.text_body = text;
        }

        const response = await axios.post(
            'https://api.smtp2go.com/v3/email/send',
            payload
        );

        console.log("[Email sent]:", response.data);

        return response.data;

    } catch (err) {
        console.error("[Email] failed:", err.response?.data || err.message);
        throw err;
    }
};

module.exports = sendEmail;