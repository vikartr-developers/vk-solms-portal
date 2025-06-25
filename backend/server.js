require('dotenv').config(); 
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path'); 

const forgotPasswordRoute = require('./routes/forgotPassword');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const salaryRoutes = require('./routes/salaryRoutes');
const offerLetterRoutes = require('./routes/offerLetterRoutes');
const resetPasswordRoute = require('./routes/resetPassword');

const app = express();
const PORT = process.env.PORT || 5000;
// const MONGODB_URI = process.env.MONGO_URI.replace(
//     "<db_password>", 
//     process.env.MONGO_PASSWORD
// );

const MONGODB_URI = process.env.MONGO_URI;


// Middleware
app.use(cors()); 
app.use(express.json()); 

app.use('/public', express.static(path.join(__dirname, 'public')));

mongoose.connect(MONGODB_URI)
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/forgot-password', forgotPasswordRoute);
app.use('/api/users', userRoutes); 
app.use('/api/salary', salaryRoutes); 
app.use('/api/offerletters', offerLetterRoutes);
app.use('/api/reset-password', resetPasswordRoute);

// Basic error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: { message: err.message || 'Something went wrong!', details: err.stack } });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
























