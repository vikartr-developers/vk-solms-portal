const mongoose = require('mongoose');

const OfferLetterSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    candidateName: {
        type: String,
        required: true, 
    },
    candidateAddress: {
        type: String,
        required: false, 
    },
    employeeId: {
        type: String,
        required: true,
        unique: true,
    },
    offerDate: {
        type: Date,
        default: Date.now,
    },
    startDate: {
        type: Date,
        required: true,
    },
    position: {
        type: String,
        required: true,
    },
    stipend: {
        type: Number,
        required: false, 
    },
    stipendInWords: {
        type: String,
        required: false, 
    },
    internshipPeriod: {
        type: String,
        required: false,
    },
    offerLetterType: {
        type: String,
        enum: ['internship_zero_stipend', 'internship_stipend', 'employee_salary'],
        required: true, 
    },
    supervisorName: {
        type: String,
        required: false,
        default: 'BHAVIK S CHUDASAMA',
    },
    companyName: {
        type: String,
        default: 'VIKARTR TECHNOLOGIES LLP',
    },
    companyAddress: {
        type: String,
        default: 'E-823, Radhe Infinity, Raksha Shakti Cir, Urjanagar 1, Randesan, Gandhinagar, Gujarat 382421',
    },
    hrName: {
        type: String,
        default: 'HR Manager',
    },
    hrDesignation: {
        type: String,
        default: 'Human Resources Manager',
    },
}, {
    timestamps: true
});

module.exports = mongoose.model('OfferLetter', OfferLetterSchema);