const mongoose = require('mongoose');

const earningsSchema = new mongoose.Schema({
    basic: { type: Number, default: 0 },
    dearnessAllowance: { type: Number, default: 0 },
    houseRentAllowance: { type: Number, default: 0 },
    conveyanceAllowance: { type: Number, default: 0 },
    medicalAllowance: { type: Number, default: 0 },
    specialAllowance: { type: Number, default: 0 },
    uniformAllowance: { type: Number, default: 0 },
    internetAllowance: { type: Number, default: 0 },
    fuelAllowance: { type: Number, default: 0 },
    childrenEducationAllowance: { type: Number, default: 0 },
    otherAllowance: { type: Number, default: 0 },
}, { _id: false });

const deductionsSchema = new mongoose.Schema({
    professionalTax: { type: Number, default: 0 },
    taxDeductedAtSource: { type: Number, default: 0 },
    employeeProvidentFund: { type: Number, default: 0 },
    lwf: { type: Number, default: 0 },
    leave: { type: Number, default: 0 },
}, { _id: false });

const salarySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    month: {
        type: String,
        required: true,
        enum: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    },
    year: {
        type: Number, 
        required: true,
    },
    monthNumeric: { 
        type: Number,
        min: 1,
        max: 12,
        required: true,
    },
    companyName: { type: String, default: 'VIKARTR TECHNOLOGIES' },
    employeeName: { type: String, required: true },
    empNo: { type: String },
    employeeEmail: { type: String },
    dateOfJoining: { type: Date },
    panNo: { type: String },
    pfNo: { type: String },
    pfUanNo: { type: String },
    esicNo: { type: String },
    aadharNo: { type: String },
    gender: { type: String },
    designation: { type: String },
    department: { type: String },
    grade: { type: String },
    vertical: { type: String },
    division: { type: String },
    location: { type: String },
    paymentMode: { type: String },
    bankName: { type: String },
    bankAccountNo: { type: String },
    salaryCtc: { type: Number, default: 0 },

    totalNumberOfDays: { type: Number, default: 0 },
    workingDays: { type: Number, default: 0 },
    paidDays: { type: Number, default: 0 },
    lopDays: { type: Number, default: 0 },
    refundDays: { type: Number, default: 0 },
    arrearDays: { type: Number, default: 0 },

    earnings: { type: earningsSchema, default: () => ({}) },
    deductions: { type: deductionsSchema, default: () => ({}) },

    grossSalary: { type: Number, default: 0 },
    totalDeductions: { type: Number, default: 0 },
    netSalary: { type: Number, default: 0 },
    netSalaryInWords: { type: String, default: 'Zero Rupees Only' },
}, {
    timestamps: true
});

salarySchema.pre('save', function(next) {
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    this.monthNumeric = months.indexOf(this.month) + 1;
    next();
});

salarySchema.index({ userId: 1, month: 1, year: 1 }, { unique: true });

const Salary = mongoose.model('Salary', salarySchema);

module.exports = Salary;