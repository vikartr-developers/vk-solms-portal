const OfferLetter = require('../models/OfferLetter');
const asyncHandler = require('express-async-handler');
const generateOfferLetterPdf = require('../utils/generateOfferLetterPdf');
const User = require('../models/User');
const NumberToWords = require('number-to-words');

// @desc    Generate and save new offer letter (for internship or employment)
// @route   POST /api/offerletters/generate
// @access  Private/Admin
const generateInternshipOfferLetter = asyncHandler(async (req, res) => {
    const {
        employeeId,
        offerDate,
        startDate,
        position,
        stipend, 
        internshipPeriod, 
        supervisorName,
        offerLetterType
    } = req.body;

    if (!employeeId || !offerDate || !startDate || !position || !offerLetterType) {
        res.status(400);
        throw new Error('Please provide employee ID, offer date, start date, position, and offer letter type.');
    }

    if ((offerLetterType === 'internship_stipend' || offerLetterType === 'employee_salary') && (stipend === undefined || stipend === null || stipend === '')) {
        res.status(400);
        throw new Error(`Stipend/Salary is required for a ${offerLetterType.replace(/_/g, ' ')} offer.`);
    }

    if (offerLetterType.startsWith('internship') && (internshipPeriod === undefined || internshipPeriod === null || internshipPeriod.trim() === '')) {
        res.status(400);
        throw new Error('Internship period is required for an internship offer.');
    }

    const user = await User.findOne({ 'employeeDetails.empNo': employeeId })
        .select('username email employeeDetails');

    if (!user) {
        res.status(404);
        throw new Error('User with provided Employee ID (empNo) not found.');
    }

    const existingOfferLetter = await OfferLetter.findOne({ userId: user._id });
    if (existingOfferLetter) {
        res.status(409);
        throw new Error('An offer letter already exists for this employee. Please update the existing one or delete it first.');
    }

    const candidateName = user.employeeDetails?.employeeName || user.username || 'N/A';
    const candidateAddress = user.employeeDetails?.permanentAddress || user.employeeDetails?.currentAddress || 'N/A';

    let amountInWords = '';
    if (stipend !== undefined && stipend !== null && stipend !== '') {
        const parsedStipend = parseFloat(stipend);
        if (!isNaN(parsedStipend)) {
            amountInWords = NumberToWords.toWords(Math.floor(parsedStipend)).toUpperCase() + ' RUPEES ONLY';
        }
    } else if (offerLetterType === 'internship_zero_stipend') {
        amountInWords = 'ZERO RUPEES ONLY';
    }


    const offerLetterData = {
        userId: user._id,
        candidateName: candidateName,
        candidateAddress: candidateAddress,
        employeeId,
        offerDate,
        startDate,
        position,
        stipend: (offerLetterType === 'internship_stipend' || offerLetterType === 'employee_salary') && stipend !== '' ? parseFloat(stipend) : undefined,
        stipendInWords: amountInWords,
        internshipPeriod: offerLetterType.startsWith('internship') ? internshipPeriod : undefined,
        supervisorName,
        offerLetterType,
        companyName: 'VIKARTR TECHNOLOGIES LLP',
        companyAddress: 'E-823, Radhe Infinity, Raksha Shakti Cir, Urjanagar 1, Randesan, Gandhinagar, Gujarat 382421',
        hrName: 'Bhavik Chudasama', 
        hrDesignation: 'Human Resources Manager',
    };

    const offerLetter = await OfferLetter.create(offerLetterData);

    const pdfBuffer = await generateOfferLetterPdf(offerLetterData);

    const filename = `${offerLetterType.replace(/_/g, '-')}_${candidateName.replace(/\s/g, '_')}_${employeeId}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(pdfBuffer);
});

// @desc    Get all offer letters (for admin)
// @route   GET /api/offerletters/all
// @access  Private/Admin
const getAllOfferLetters = asyncHandler(async (req, res) => {
    const offerLetters = await OfferLetter.find({})
        .populate('userId', 'username email employeeDetails.employeeName employeeDetails.empNo');
    res.status(200).json(offerLetters);
});

// @desc    Get single offer letter by ID
// @route   GET /api/offerletters/:id
// @access  Private/Admin or User (if it's their own)
const getOfferLetterById = asyncHandler(async (req, res) => {
    const offerLetter = await OfferLetter.findById(req.params.id)
        .populate('userId', 'username email employeeDetails.employeeName employeeDetails.empNo');

    if (!offerLetter) {
        res.status(404);
        throw new Error('Offer Letter not found');
    }

    if (req.user.role !== 'admin' && offerLetter.userId && offerLetter.userId._id.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to view this offer letter');
    }

    res.status(200).json(offerLetter);
});

// @desc    Update offer letter by ID (for admin)
// @route   PUT /api/offerletters/:id
// @access  Private/Admin
const updateOfferLetter = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const offerLetter = await OfferLetter.findById(id);

    if (!offerLetter) {
        res.status(404);
        throw new Error('Offer Letter not found');
    }

    if (req.body.stipend !== undefined && req.body.stipend !== null && req.body.stipend !== '') {
        req.body.stipend = parseFloat(req.body.stipend);
        req.body.stipendInWords = NumberToWords.toWords(Math.floor(req.body.stipend)).toUpperCase() + ' RUPEES ONLY';
    } else if (req.body.offerLetterType === 'internship_zero_stipend') {
         req.body.stipend = undefined; 
         req.body.stipendInWords = 'ZERO RUPEES ONLY';
    } else {
        req.body.stipend = undefined;
        req.body.stipendInWords = undefined;
    }

    if (req.body.offerDate) req.body.offerDate = new Date(req.body.offerDate);
    if (req.body.startDate) req.body.startDate = new Date(req.body.startDate);

    if (req.body.offerLetterType && !req.body.offerLetterType.startsWith('internship')) {
        req.body.internshipPeriod = undefined;
    }

    Object.keys(req.body).forEach(key => {
        offerLetter[key] = req.body[key];
    });

    const updatedOfferLetter = await offerLetter.save();
    res.status(200).json(updatedOfferLetter);
});

// @desc    Delete offer letter by ID (for admin)
// @route   DELETE /api/offerletters/:id
// @access  Private/Admin
const deleteOfferLetter = asyncHandler(async (req, res) => {
    const offerLetter = await OfferLetter.findById(req.params.id);

    if (!offerLetter) {
        res.status(404);
        throw new Error('Offer Letter not found');
    }

    await offerLetter.deleteOne();
    res.status(200).json({ message: 'Offer letter removed successfully' });
});

// @desc    Download offer letter PDF
// @route   GET /api/offerletters/download/:id
// @access  Private/Admin or User (if it's their own)
const downloadOfferLetter = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const offerLetterDoc = await OfferLetter.findById(id)
        .populate('userId', 'username employeeId employeeDetails.employeeName employeeDetails.empNo');

    if (!offerLetterDoc) {
        res.status(404);
        console.error(` Offer Letter with ID ${id} not found.`);
        throw new Error('Offer Letter data not found');
    }

    const offerLetterUserId = offerLetterDoc.userId ? offerLetterDoc.userId._id.toString() : null;
    const requestingUserId = req.user._id ? req.user._id.toString() : null;

    if (req.user.role !== 'admin' && offerLetterUserId !== requestingUserId) {
        res.status(403);
        console.error(` User ${requestingUserId} (Role: ${req.user.role}) not authorized to download offer letter ${id} (Owner: ${offerLetterUserId}).`);
        throw new Error('Not authorized to download this offer letter');
    }

    try {
        const filenameCandidateName = offerLetterDoc.candidateName || offerLetterDoc.userId?.employeeDetails?.employeeName || offerLetterDoc.userId?.username || 'unknown';
        const filenameEmployeeId = offerLetterDoc.employeeId || offerLetterDoc.userId?.employeeDetails?.empNo || offerLetterDoc.userId?.employeeId || 'N_A';
        const filenameOfferType = offerLetterDoc.offerLetterType ? offerLetterDoc.offerLetterType.replace(/_/g, '-') : 'offer-letter';

        const offerLetterDataPlain = offerLetterDoc.toObject();
        offerLetterDataPlain.offerLetterType = offerLetterDoc.offerLetterType;


        const pdfBuffer = await generateOfferLetterPdf(offerLetterDataPlain);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${filenameOfferType}_${filenameCandidateName.replace(/\s/g, '_')}_${filenameEmployeeId}.pdf`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error(' Error during PDF generation or sending:', error);
        res.status(500).json({ message: 'Error generating PDF', error: error.message });
    }
});


// @desc    Get a single offer letter for a specific user (for existence check)
// @route   GET /api/offerletters/user/:userId
// @access  Private (User can only view their own, Admin can view any)
const getUserOfferLetterForCheck = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
        res.status(403);
        throw new Error('Not authorized to view this offer letter');
    }

    const offerLetter = await OfferLetter.findOne({ userId: userId })
        .populate('userId', 'username employeeId employeeDetails.employeeName employeeDetails.empNo');

    if (!offerLetter) {
        res.status(404).json({ message: 'No offer letter found for this user.' });
        return;
    }

    res.status(200).json(offerLetter);
});


module.exports = {
    generateInternshipOfferLetter,
    getAllOfferLetters,
    getOfferLetterById,
    updateOfferLetter,
    deleteOfferLetter,
    downloadOfferLetter,
    getUserOfferLetterForCheck,
};