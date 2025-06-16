const express = require('express');
const nodemailer = require('nodemailer');
const router = express.Router();
require('dotenv').config();

const smtpHost = process.env.SMTP_SERVER_HOST;
const smtpUser = process.env.SMTP_SERVER_USERNAME;
const smtpPass = process.env.SMTP_SERVER_PASSWORD;
const fromEmail = process.env.FROM_MAIL;
const frontendBaseUrl = process.env.FRONTEND_URL;

router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    try {
        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: 587,
            secure: false,
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
        });

        const resetLink = `${frontendBaseUrl}/reset-password?email=${encodeURIComponent(email)}`;

        await transporter.sendMail({
            from: fromEmail,
            to: email,
            subject: 'Password Reset Request',
            html: `
                <h3>Password Reset</h3>
                <p>You requested a password reset. Click the link below:</p>
                <a href="${resetLink}">${resetLink}</a>
                <p>If you didn’t request this, please ignore this email.</p>
            `,
        });

        return res.json({ message: 'Password reset email sent!' });
    } catch (error) {
        console.error('Email send failed:', error);
        return res.status(500).json({ message: 'Error sending email' });
    }
});

module.exports = router;
