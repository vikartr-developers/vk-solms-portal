const User = require('../models/User'); 

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin only)
exports.getUsers = async (req, res) => {
    try {
        console.log('Fetching all users...');
        const users = await User.find().select('username email role employeeId employeeDetails');
        // console.log(`Fetched ${users.length} use rs. Example user employeeDetails:`, users[0]?.employeeDetails);
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get a single user by ID
// @route   GET /api/users/:id
// @access  Private (Admin only)
exports.getUserById = async (req, res) => {
    try {
        console.log(`Fetching user by ID: ${req.params.id}`);
        const user = await User.findById(req.params.id).select('username email role employeeId employeeDetails');
        if (!user) {
            console.log(`User with ID ${req.params.id} not found.`);
            return res.status(404).json({ message: 'User not found' });
        }
        // console.log('User found:', user.username, 'Employee Details:', user.employeeDetails);
        res.json(user);
    } catch (error) {
        console.error(`Error fetching user by ID ${req.params.id}:`, error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update a user's details (Admin only)
// @route   PUT /api/users/:id
// @access  Private (Admin only)
exports.updateUser = async (req, res) => {
    const { username, email, role, employeeDetails } = req.body;

    try {
        let user = await User.findById(req.params.id); 
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (username && username !== user.username) {
            const existingUser = await User.findOne({ username });
            if (existingUser && existingUser._id.toString() !== req.params.id) {
                return res.status(400).json({ message: 'Username already taken' });
            }
        }
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser && existingUser._id.toString() !== req.params.id) {
                return res.status(400).json({ message: 'Email already registered' });
            }
        }
        if (employeeDetails && employeeDetails.empNo && user.employeeDetails?.empNo !== employeeDetails.empNo) {
            const existingEmp = await User.findOne({ 'employeeDetails.empNo': employeeDetails.empNo });
            if (existingEmp && existingEmp._id.toString() !== req.params.id) {
                return res.status(400).json({ message: 'Employee Number already exists' });
            }
        }
        
        user.username = username !== undefined ? username : user.username;
        user.email = email !== undefined ? email : user.email;
        user.role = role !== undefined ? role : user.role;

        if (!user.employeeDetails) {
            user.employeeDetails = {};
        }

        if (employeeDetails) {
            for (const key in employeeDetails) {
                if (employeeDetails[key] !== undefined) {
                    user.employeeDetails[key] = employeeDetails[key];
                }
            }
            user.markModified('employeeDetails');
        }

        await user.save();
        console.log('User updated successfully:', user.username);
        res.json({
            message: 'User updated successfully',
            user: user.toObject({ getters: true, virtuals: false }) 
        });

    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Delete a user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id); 

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (req.user.id === req.params.id) {
            return res.status(403).json({ message: 'You cannot delete your own admin account through this route.' });
        }

        await User.deleteOne({ _id: req.params.id });
        console.log('User removed successfully:', req.params.id);
        res.json({ message: 'User removed successfully' });

    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};  