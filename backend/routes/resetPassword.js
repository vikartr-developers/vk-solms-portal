const express = require('express');
const router = express.Router();
const User = require('../models/User'); 

router.post('/', async (req, res) => {
    const { email, password } = req.body; 

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and new password are required' });
    }

    try {

        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.password = password;
        await user.save();

        // console.log(`Password successfully reset for user: ${email} and saved to DB.`);
        res.json({ message: 'Password successfully reset!' });

    } catch (error) {
        console.error('Password reset failed:', error);
        res.status(500).json({ message: 'Something went wrong during password reset', error: error.message });
    }
});

module.exports = router;
