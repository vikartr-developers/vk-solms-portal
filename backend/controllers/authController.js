const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const generateRandomPassword = require('../utils/passwordGenerator');
const sendEmail = require('../utils/sendEmail');

const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: '3h',
    });
};

exports.registerUser = async (req, res) => {
    const { username, email, role, employeeDetails } = req.body;

    try {
        let userExists = await User.findOne({ $or: [{ email }, { username }] });
        if (userExists) {
            return res.status(400).json({ message: 'User with this email or username already exists.' });
        }

        if (employeeDetails && employeeDetails.empNo) {
            let empNoExists = await User.findOne({ 'employeeDetails.empNo': employeeDetails.empNo });
            if (empNoExists) {
                return res.status(400).json({ message: 'Employee with this Employee Number already exists.' });
            }
        }

        const generatedPlainPassword = generateRandomPassword();
        const hashedPassword = await bcrypt.hash(generatedPlainPassword, 10);

        const user = await User.create({
            username,
            email,
            password: hashedPassword,
            role: role || 'user',
            employeeDetails: employeeDetails || {},
        });

        try {
            const emailSubject = 'Your New Account Credentials for VIKARTR TECHNOLOGIES';
            const emailHtml = `
                <p>Dear ${user.username},</p>
                <p>Your account for the Employee Management System has been successfully created.</p>
                <p>Here are your login details:</p>
                <ul>
                    <li><strong>Username:</strong> ${user.username}</li>
                    <li><strong>Email:</strong> ${user.email}</li>
                    <li><strong>Temporary Password:</strong> <strong>${generatedPlainPassword}</strong></li>
                </ul>
                <p>Please log in using these credentials at <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}">Our Login Page</a> and change your password immediately for security reasons.</p>
                <p>If you have any questions, please contact support.</p>
                <p>Regards,<br/>The VIKARTR TECHNOLOGIES Team</p>
            `;

            await sendEmail({
                email: user.email,
                subject: emailSubject,
                html: emailHtml
            });
            console.log(`Password email successfully sent to ${user.email}`);

            res.status(201).json({
                message: 'User created successfully and password sent to email!',
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    employeeDetails: user.employeeDetails,
                },
            });

        } catch (emailError) {
            console.error('Error sending password email:', emailError);
            res.status(201).json({
                message: 'User created successfully, but failed to send password email. Please inform the user manually.',
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    employeeDetails: user.employeeDetails,
                },
                emailError: emailError.message
            });
        }

    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Server error during registration.', error: error.message });
    }
};

exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const adminCount = await User.countDocuments({ role: 'admin' });

        if (adminCount === 0) {
            const adminEmail = process.env.ADMIN_EMAIL || 'developers@vikartrtechnologies.com';
            const adminPassword = process.env.ADMIN_PASSWORD || 'bhavik@1234';

            let initialAdminUser = await User.findOne({ email: adminEmail });

            if (!initialAdminUser) {
                console.log('No admin user found. Creating initial admin...');
                const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);
                initialAdminUser = await User.create({
                    username: 'Super Admin',
                    email: adminEmail,
                    password: hashedAdminPassword,
                    role: 'admin',
                });
                console.log('Initial admin user created successfully!');
            }
        }

        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        res.json({
            message: 'Login successful',
            token: generateToken(user._id, user.role),
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                employeeDetails: user.employeeDetails,
            },
        });

    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ message: 'Server error during login.', error: error.message });
    }
};

exports.changePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    try {
        const user = await User.findById(req.user.id).select('+password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await user.matchPassword(oldPassword);
        if (!isMatch) {
            return res.status(400).json({ message: 'Old password is incorrect' });
        }

        user.password = newPassword;
        await user.save();

        res.json({ message: 'Password changed successfully' });

    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ message: 'Server error during password change.', error: error.message });
    }
};

exports.createInitialAdmin = async (req, res) => {
    try {
        const adminEmail = process.env.ADMIN_EMAIL || 'developers@vikartrtechnologies.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'bhavik@1234';

        if (!adminEmail || !adminPassword) {
            return res.status(400).json({ message: 'ADMIN_EMAIL and ADMIN_PASSWORD environment variables must be set or default values will be used.' });
        }

        let adminUser = await User.findOne({ email: adminEmail });

        if (adminUser) {
            return res.status(200).json({ message: 'Admin user already exists.' });
        }

        const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);

        adminUser = await User.create({
            username: 'Super Admin',
            email: adminEmail,
            password: hashedAdminPassword,
            role: 'admin',
        });

        res.status(201).json({ message: 'Initial admin user created successfully!', admin: { email: adminUser.email } });

    } catch (error) {
        console.error('Error creating initial admin:', error);
        res.status(500).json({ message: 'Server error creating initial admin.', error: error.message });
    }
};