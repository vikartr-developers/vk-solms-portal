// backend/routes/salaryRoutes.js
const express = require('express');
const {
    createSalary,
    getRecentSalarySlipForUser, // Import the controller function for fetching the most recent slip
    getSalarySlipByUserIdAndPeriod,
    updateSalary,
    getUserSalarySlips,
    getSalarySlipById,
    deleteSalarySlip,
    downloadSalarySlip,
    getAllSalarySlips,
} = require('../controllers/salaryController');

// Assuming you have middleware for authentication and role-based authorization
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes (if any, typically none for salary management)

// Admin-specific routes (requiring 'admin' role)
router.route('/all')
    .get(protect, authorizeRoles('admin'), getAllSalarySlips); // Admin gets all salary slips for all users

router.route('/:userId')
    .post(protect, authorizeRoles('admin'), createSalary); // Admin creates a new salary slip for a specific user

router.route('/:salaryId')
    .put(protect, authorizeRoles('admin'), updateSalary); // Admin updates an existing salary slip by its ID

router.route('/:id')
    .delete(protect, authorizeRoles('admin'), deleteSalarySlip); // Admin deletes a salary slip by its ID


// Routes accessible by Admin or the specific User (for their own data)
// Note: Order matters. More specific routes should come before more general ones.

// Get the most recent salary slip for a specific user
router.route('/:userId/recent')
    .get(protect, authorizeRoles('admin', 'user'), getRecentSalarySlipForUser);

// Fetch a specific salary slip by userId AND month/year
router.route('/:userId/period')
    .get(protect, authorizeRoles('admin', 'user'), getSalarySlipByUserIdAndPeriod);

// Get all salary slips for a specific user
router.route('/user/:userId')
    .get(protect, authorizeRoles('admin', 'user'), getUserSalarySlips);

// Get a single salary slip by its salary slip ID
// This route is placed after more specific ones to avoid conflicts (e.g., matching 'recent' as an ID)
router.route('/:id')
    .get(protect, authorizeRoles('admin', 'user'), getSalarySlipById); // Both admin and authorized user can view

// Download a specific salary slip PDF
router.route('/download/:salaryId')
    .get(protect, authorizeRoles('admin', 'user'), downloadSalarySlip);

module.exports = router;