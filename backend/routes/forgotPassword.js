const express = require('express');
const nodemailer = require('nodemailer');
const router = express.Router();

require('dotenv').config();

const smtpHost = process.env.SMTP_SERVER_HOST;
const smtpUser = process.env.SMTP_SERVER_USERNAME;
const smtpPass = process.env.SMTP_SERVER_PASSWORD;
const fromEmail = process.env.FROM_MAIL;

router.post('/', async (req, res) => {
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

        const resetLink = `http://localhost:3000/reset-password?email=${encodeURIComponent(email)}`;

        await transporter.sendMail({
            from: fromEmail,
            to: email,
            subject: 'Password Reset',
            html: `
                <p>You requested a password reset.</p>
                <p><a href="${resetLink}">Click here to reset your password</a></p>
            `,
        });

        res.json({ message: 'Password reset email sent!' });
    } catch (error) {
        console.error('Email send failed:', error);
        res.status(500).json({ message: 'Error sending email' });
    }
});

module.exports = router;
