const express = require('express');
const { registerUser, loginUser, changePassword, createInitialAdmin } = require('../controllers/authController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/login', loginUser);
router.get('/create-admin', createInitialAdmin); 

router.post('/register', protect, authorizeRoles('admin'), registerUser); 
router.put('/change-password', protect, changePassword); 

module.exports = router;