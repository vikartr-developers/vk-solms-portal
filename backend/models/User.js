const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Please add a username'],
        unique: true,
        trim: true,
        maxlength: [50, 'Username cannot be more than 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false 
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    employeeDetails: {
        employeeName: { type: String, trim: true }, 
        empNo: {
            type: String,
            unique: true,
            sparse: true 
        },
        dateOfJoining: { type: Date }, 
        panNo: { type: String, trim: true }, 
        pfNo: { type: String, trim: true }, 
        pfUanNo: { type: String, trim: true }, 
        esicNo: { type: String, trim: true }, 
        aadharNo: { type: String, trim: true }, 
        gender: { type: String, enum: ['Male', 'Female', 'Other'], trim: true }, 
        designation: { type: String, trim: true }, 
        department: { type: String, trim: true },
        grade: { type: String, trim: true }, 
        vertical: { type: String, trim: true }, 
        division: { type: String, trim: true },
        location: { type: String, trim: true },
        paymentMode: { type: String, trim: true }, 
        bankName: { type: String, trim: true }, 
        bankAccountNo: { type: String, trim: true }, 
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true 
});

UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        console.log('Password not modified, skipping hashing.');
        return next();
    }

    if (this.password.startsWith('$2a$') || this.password.startsWith('$2b$')) {
        console.warn('Password already appears to be hashed. Skipping re-hashing.');
        return next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

UserSchema.methods.matchPassword = async function(enteredPassword) {
    
    if (!this.password || !(this.password.startsWith('$2a$') || this.password.startsWith('$2b$'))) {
        console.error('ERROR: Stored password is NOT a valid bcrypt hash. It is:', this.password);
        return false; 
    }

    const isMatch = await bcrypt.compare(enteredPassword, this.password);
    return isMatch;
};

module.exports = mongoose.model('User', UserSchema);