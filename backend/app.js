const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const salaryRoutes = require('./src/routes/salaryRoutes');

const app = express();

// Middleware
app.use(cors()); 
app.use(bodyParser.json()); 

// Routes
app.use('/api', salaryRoutes); // All salary-related routes will be prefixed with /api

app.use((req, res, next) => {
    const error = new Error('Not Found');
    error.status = 404;
    next(error);
});

// General error handler
app.use((error, req, res, next) => {
    res.status(error.status || 500);
    res.json({
        error: {
            message: error.message,
        },
    });
});

module.exports = app;