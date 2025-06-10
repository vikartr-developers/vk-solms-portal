const express = require('express');
const router = express.Router();
const {
    generateInternshipOfferLetter,
    getAllOfferLetters,
    getOfferLetterById,
    updateOfferLetter,
    deleteOfferLetter,
    downloadOfferLetter,
    getUserOfferLetterForCheck
} = require('../controllers/offerLetterController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.route('/generate')
    .post(protect, authorizeRoles('admin'), generateInternshipOfferLetter);

router.route('/all')
    .get(protect, authorizeRoles('admin'), getAllOfferLetters);

router.route('/:id')
    .get(protect, authorizeRoles('admin', 'employee'), getOfferLetterById)
    .put(protect, authorizeRoles('admin'), updateOfferLetter)
    .delete(protect, authorizeRoles('admin'), deleteOfferLetter);

router.route('/download/:id')
    .get(protect, authorizeRoles('admin', 'user'), downloadOfferLetter);

router.route('/user/:userId')
    .get(protect, authorizeRoles('admin', 'user'), getUserOfferLetterForCheck);

module.exports = router;