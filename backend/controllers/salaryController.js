// backend/controllers/salaryController.js
const Salary = require('../models/Salary'); 
const User = require('../models/User');     
const generatePdf = require('../utils/pdfGenerator'); 
const NumberToWords = require('number-to-words'); // Import NumberToWords for netSalaryInWords calculation

const getEmployeeDataFromUser = (user) => {
    if (!user || !user.employeeDetails) {
        return {};
    }

    const details = user.employeeDetails;
    const employeeData = {
        companyName: 'VIKARTR TECHNOLOGIES', 
        employeeName: details.employeeName || `${details.firstName || ''} ${details.lastName || ''}`.trim() || user.username || '',
        empNo: details.empNo || '',
        employeeEmail: user.email || '', 
        dateOfJoining: details.dateOfJoining ? new Date(details.dateOfJoining) : undefined, // Keep as Date object, don't format to string here
        panNo: details.panNo || '',
        pfNo: details.pfNo || '',
        pfUanNo: details.pfUanNo || '',
        esicNo: details.esicNo || '',
        aadharNo: details.aadharNo || '',
        gender: details.gender || '',
        designation: details.designation || '',
        department: details.department || '',
        grade: details.grade || '',
        vertical: details.vertical || '',
        division: details.division || '',
        location: details.location || '',
        paymentMode: details.paymentMode || '',
        bankName: details.bankName || '',
        bankAccountNo: details.bankAccountNo || '',
        // salaryCtc, earnings, and deductions should come directly from req.body (frontend calculations)
        // rather than potentially stale employeeDetails on the User model for a specific salary slip.
    };
    return employeeData;
};

const getMonthNumeric = (monthName) => {
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const index = months.indexOf(monthName);
    return index !== -1 ? index + 1 : null; 
};

// @desc    Get the most recent salary slip for a user
// @route   GET /api/salary/:userId/recent
// @access  Private (Admin or User - user can get their own)
exports.getRecentSalarySlipForUser = async (req, res, next) => {
    try {
        const { userId } = req.params;
        console.log(`[getRecentSalarySlipForUser] Fetching most recent salary for userId: ${userId}`);

        if (req.user.role === 'user' && req.user.id !== userId) {
            return res.status(403).json({ message: 'Forbidden: You can only access your own salary slips.' });
        }

        const recentSalary = await Salary.findOne({ userId })
            .sort({ year: -1, monthNumeric: -1 })
            .lean(); 

        if (!recentSalary) {
            console.log(`[getRecentSalarySlipForUser] No recent salary slip found for user ${userId}.`);
            return res.status(404).json({ message: 'No recent salary slip found for this user.' });
        }

        const user = await User.findById(userId).populate('employeeDetails');
        let employeeData = {};
        if (user) {
            employeeData = getEmployeeDataFromUser(user);
        }

        console.log(`[getRecentSalarySlipForUser] Recent salary slip found for ID: ${recentSalary._id}`);
        res.status(200).json({
            ...employeeData, // Populate base employee profile details
            ...recentSalary, // Overlay with specific salary data
            userId: recentSalary.userId,
            // Ensure dateOfJoining is consistently formatted for frontend
            dateOfJoining: recentSalary.dateOfJoining ? new Date(recentSalary.dateOfJoining).toISOString().split('T')[0] : (employeeData.dateOfJoining ? employeeData.dateOfJoining.toISOString().split('T')[0] : ''),
        });

    } catch (error) {
        console.error('[getRecentSalarySlipForUser] Error:', error);
        next(error); // Pass error to Express error handling middleware
    }
};

// @desc    Get a specific salary slip for a user by month and year
// @route   GET /api/salary/:userId/period?month=June&year=2025
// @access  Private (Admin or User - user can get their own)
exports.getSalarySlipByUserIdAndPeriod = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { month, year } = req.query;

        console.log(`[getSalarySlipByUserIdAndPeriod] Fetching salary for userId: ${userId}, month: ${month}, year: ${year}`);

        if (!month || !year) {
            return res.status(400).json({ message: 'Month and year query parameters are required.' });
        }

        if (req.user.role === 'user' && req.user.id !== userId) {
            return res.status(403).json({ message: 'Forbidden: You can only access your own salary slips.' });
        }

        const salary = await Salary.findOne({ userId, month, year: Number(year) }).lean();

        if (!salary) {
            console.log(`[getSalarySlipByUserIdAndPeriod] Salary slip not found for user ${userId}, month ${month}, year ${year}.`);
            return res.status(404).json({ message: 'Salary slip not found for the specified month and year.' });
        }

        const user = await User.findById(userId).populate('employeeDetails');
        let employeeData = {};
        if (user) {
            employeeData = getEmployeeDataFromUser(user);
        }

        console.log(`[getSalarySlipByUserIdAndPeriod] Salary slip found for ID: ${salary._id}`);
        res.status(200).json({
            ...employeeData, // Populate base employee profile details
            ...salary,      // Overlay with specific salary data
            userId: salary.userId,
            dateOfJoining: salary.dateOfJoining ? new Date(salary.dateOfJoining).toISOString().split('T')[0] : (employeeData.dateOfJoining ? employeeData.dateOfJoining.toISOString().split('T')[0] : ''),
        });

    } catch (error) {
        console.error('[getSalarySlipByUserIdAndPeriod] Error:', error);
        next(error); 
    }
};

// @desc    Admin creates a new salary slip for a specific user and month/year
// @route   POST /api/salary/:userId
// @access  Private (Admin)
exports.createSalary = async (req, res, next) => {
    try {
        const { userId } = req.params;
        // Destructure all expected fields from req.body explicitly
        const {
            month, year,
            companyName, employeeName, empNo, employeeEmail, dateOfJoining,
            panNo, pfNo, pfUanNo, esicNo, aadharNo, gender, designation,
            department, grade, vertical, division, location, paymentMode,
            bankName, bankAccountNo, totalNumberOfDays, workingDays, paidDays,
            lopDays, refundDays, arrearDays,
            earnings, deductions, // These are objects
            grossSalary, totalDeductions, netSalary, salaryCtc // These are the calculated values
        } = req.body;

        // console.log(`[createSalary] Incoming req.body:`, req.body); // !!! CRITICAL DEBUG LOG !!!

        if (!month || !year || !userId) {
            return res.status(400).json({ message: 'User ID, month, and year are required.' });
        }

        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: Only administrators can create salary slips.' });
        }

        const user = await User.findById(userId).populate('employeeDetails');
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const monthNumeric = getMonthNumeric(month);
        if (monthNumeric === null) {
            return res.status(400).json({ message: 'Invalid month name provided.' });
        }

        // Check if a salary slip for this user and period already exists
        const existingSalary = await Salary.findOne({ userId, month, year: Number(year) });
        if (existingSalary) {
            console.log(`[createSalary] Existing salary found for ${month}, ${year} for user ${userId}.`);
            return res.status(409).json({ message: `Salary slip for ${month} ${year} already exists for this user. Please edit the existing one.` });
        }

        // Calculate netSalaryInWords here on the backend based on received netSalary
        let netSalaryInWords = 'Zero Rupees Only';
        if (typeof netSalary === 'number' && netSalary > 0) {
            netSalaryInWords = NumberToWords.toWords(Math.floor(netSalary)) + ' Rupees Only';
            if (netSalary % 1 !== 0) { // If there are decimals (paise)
                const paise = Math.round((netSalary % 1) * 100);
                if (paise > 0) {
                    netSalaryInWords += ` and ${NumberToWords.toWords(paise)} Paise Only`;
                }
            }
            netSalaryInWords = netSalaryInWords.replace(/(^|\s)\S/g, (char) => char.toUpperCase()); // Capitalize first letter of each word
        }


        const newSalary = new Salary({
            userId,
            month,
            year: Number(year),
            monthNumeric,
            companyName: companyName || 'VIKARTR TECHNOLOGIES', // Use provided or default
            employeeName: employeeName,
            empNo: empNo,
            employeeEmail: employeeEmail,
            dateOfJoining: dateOfJoining ? new Date(dateOfJoining) : undefined, // Ensure it's a Date object if provided
            panNo, pfNo, pfUanNo, esicNo, aadharNo, gender, designation,
            department, grade, vertical, division, location, paymentMode,
            bankName, bankAccountNo, totalNumberOfDays, workingDays, paidDays,
            lopDays, refundDays, arrearDays,
            
            // Explicitly assign calculated salary fields from req.body
            grossSalary: grossSalary || 0,
            totalDeductions: totalDeductions || 0,
            netSalary: netSalary || 0,
            salaryCtc: salaryCtc || 0, // This should come from the form input, not employeeDetails directly

            earnings: earnings || {},
            deductions: deductions || {},
            netSalaryInWords // Assign the calculated words
        });

        await newSalary.save(); 
        // console.log(`[createSalary] Salary slip created with ID: ${newSalary._id} - Saved Data:`, newSalary); // !!! CRITICAL DEBUG LOG !!!
        res.status(201).json({ message: 'Salary slip created successfully', salary: newSalary }); 

    } catch (error) {
        console.error('[createSalary] Error creating salary slip:', error);
        if (error.code === 11000) { 
            return res.status(409).json({ message: 'A salary slip for this user and period already exists.' });
        }
        next(error);
    }
};

// @desc    Admin updates an existing salary slip
// @route   PUT /api/salary/:salaryId
// @access  Private (Admin)
exports.updateSalary = async (req, res, next) => {
    try {
        const { salaryId } = req.params;
        // Destructure all expected fields from req.body explicitly for update
        const {
            month, year,
            companyName, employeeName, empNo, employeeEmail, dateOfJoining,
            panNo, pfNo, pfUanNo, esicNo, aadharNo, gender, designation,
            department, grade, vertical, division, location, paymentMode,
            bankName, bankAccountNo, totalNumberOfDays, workingDays, paidDays,
            lopDays, refundDays, arrearDays,
            earnings, deductions, // These are objects
            grossSalary, totalDeductions, netSalary, salaryCtc // These are the calculated values
        } = req.body;

        // console.log(`[updateSalary] Incoming req.body for update:`, req.body); // !!! CRITICAL DEBUG LOG !!!

        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: Only administrators can update salary slips.' });
        }

        let salary = await Salary.findById(salaryId);

        if (!salary) {
            return res.status(404).json({ message: 'Salary slip not found.' });
        }

        // Handle month/year updates
        if (month) {
            const newMonthNumeric = getMonthNumeric(month);
            if (newMonthNumeric === null) {
                return res.status(400).json({ message: 'Invalid month name provided for update.' });
            }
            salary.month = month;
            salary.monthNumeric = newMonthNumeric;
        }
        if (year) {
            salary.year = Number(year);
        }

        // Calculate netSalaryInWords here on the backend
        let netSalaryInWords = 'Zero Rupees Only';
        // Use the netSalary from updatedFields if provided, otherwise the existing one
        const currentNetSalary = netSalary !== undefined ? netSalary : salary.netSalary;
        if (typeof currentNetSalary === 'number' && currentNetSalary > 0) {
            netSalaryInWords = NumberToWords.toWords(Math.floor(currentNetSalary)) + ' Rupees Only';
            if (currentNetSalary % 1 !== 0) { // If there are decimals (paise)
                const paise = Math.round((currentNetSalary % 1) * 100);
                if (paise > 0) {
                    netSalaryInWords += ` and ${NumberToWords.toWords(paise)} Paise Only`;
                }
            }
            netSalaryInWords = netSalaryInWords.replace(/(^|\s)\S/g, (char) => char.toUpperCase());
        }
        salary.netSalaryInWords = netSalaryInWords;

        // Manually assign each field from req.body if it exists in the request
        // This ensures the current values are used and mongoose tracks changes correctly.
        if (companyName !== undefined) salary.companyName = companyName;
        if (employeeName !== undefined) salary.employeeName = employeeName;
        if (empNo !== undefined) salary.empNo = empNo;
        if (employeeEmail !== undefined) salary.employeeEmail = employeeEmail;
        if (dateOfJoining !== undefined) salary.dateOfJoining = dateOfJoining ? new Date(dateOfJoining) : undefined;
        if (panNo !== undefined) salary.panNo = panNo;
        if (pfNo !== undefined) salary.pfNo = pfNo;
        if (pfUanNo !== undefined) salary.pfUanNo = pfUanNo;
        if (esicNo !== undefined) salary.esicNo = esicNo;
        if (aadharNo !== undefined) salary.aadharNo = aadharNo;
        if (gender !== undefined) salary.gender = gender;
        if (designation !== undefined) salary.designation = designation;
        if (department !== undefined) salary.department = department;
        if (grade !== undefined) salary.grade = grade;
        if (vertical !== undefined) salary.vertical = vertical;
        if (division !== undefined) salary.division = division;
        if (location !== undefined) salary.location = location;
        if (paymentMode !== undefined) salary.paymentMode = paymentMode;
        if (bankName !== undefined) salary.bankName = bankName;
        if (bankAccountNo !== undefined) salary.bankAccountNo = bankAccountNo;
        
        // Calculated fields:
        if (grossSalary !== undefined) salary.grossSalary = grossSalary;
        if (totalDeductions !== undefined) salary.totalDeductions = totalDeductions;
        if (netSalary !== undefined) salary.netSalary = netSalary;
        if (salaryCtc !== undefined) salary.salaryCtc = salaryCtc;

        // Nested objects: Merge them carefully
        if (earnings) {
            Object.assign(salary.earnings, earnings);
        }
        if (deductions) {
            Object.assign(salary.deductions, deductions);
        }

        // Days info
        if (totalNumberOfDays !== undefined) salary.totalNumberOfDays = totalNumberOfDays;
        if (workingDays !== undefined) salary.workingDays = workingDays;
        if (paidDays !== undefined) salary.paidDays = paidDays;
        if (lopDays !== undefined) salary.lopDays = lopDays;
        if (refundDays !== undefined) salary.refundDays = refundDays;
        if (arrearDays !== undefined) salary.arrearDays = arrearDays;


        await salary.save(); // Use save() to trigger pre-save hooks and full validation

        console.log(`[updateSalary] Salary slip updated with ID: ${salary._id} - Saved Data:`, salary); // !!! CRITICAL DEBUG LOG !!!
        res.status(200).json({ message: 'Salary slip updated successfully', salary: salary });

    } catch (error) {
        console.error('[updateSalary] Error updating salary slip:', error);
        if (error.code === 11000) { // Mongoose duplicate key error
            return res.status(409).json({ message: 'A salary slip for this user and period already exists.' });
        }
        next(error);
    }
};


// @desc    Get all salary slips for a specific user (Admin or User's own)
// @route   GET /api/salary/user/:userId
// @access  Private (User can get their own, Admin can get any)
exports.getUserSalarySlips = async (req, res, next) => {
    try {
        const { userId } = req.params;
        // console.log(`[getUserSalarySlips] Fetching slips for userId: ${userId}`);

        // Authorization check
        if (req.user.role === 'user' && req.user.id !== userId) {
            return res.status(403).json({ message: 'Forbidden: You can only access your own salary slips.' });
        }

        // Sort by year and monthNumeric for accurate chronological order
        const salaries = await Salary.find({ userId }).sort({
            'year': -1,
            'monthNumeric': -1,
        }).lean(); 
        const user = await User.findById(userId).populate('employeeDetails');
        let employeeData = {};
        if (user) {
            employeeData = getEmployeeDataFromUser(user);
        }

        // Enhance each salary slip with current employee data before sending
        const enhancedSalaries = salaries.map(slip => {
            return {
                ...employeeData, 
                ...slip,        
                dateOfJoining: slip.dateOfJoining ? new Date(slip.dateOfJoining).toISOString().split('T')[0] : employeeData.dateOfJoining,
            };
        });

        // console.log(`[getUserSalarySlips] Found ${enhancedSalaries.length} slips for user ${userId}.`);
        res.json(enhancedSalaries);
    } catch (err) {
        console.error('[getUserSalarySlips] Error fetching user salary slips:', err);
        next(err);
    }
};

// @desc    Get a single salary slip by ID (Admin or User's own if linked)
// @route   GET /api/salary/:id
// @access  Private (Admin or User)
exports.getSalarySlipById = async (req, res, next) => {
    try {
        console.log(`[getSalarySlipById] Fetching slip by ID: ${req.params.id}`);
        const salary = await Salary.findById(req.params.id).lean();

        if (!salary) {
            // console.log(`[getSalarySlipById] Salary slip with ID ${req.params.id} not found.`);
            return res.status(404).json({ message: 'Salary slip not found.' });
        }

        // Authorization check
        if (req.user.role === 'user' && salary.userId.toString() !== req.user.id) {
            // console.log(`[getSalarySlipById] Forbidden access for user ${req.user.id} to slip ${req.params.id}`);
            return res.status(403).json({ message: 'Forbidden: You do not have access to this salary slip.' });
        }

        // Also fetch and include employee data when getting a single slip by ID
        const user = await User.findById(salary.userId).populate('employeeDetails');
        let employeeData = {};
        if (user) {
            employeeData = getEmployeeDataFromUser(user);
        }

        // console.log(`[getSalarySlipById] Salary slip found for ID: ${salary._id}`);
       
        res.status(200).json({
            ...employeeData, // Start with current employee profile data
            ...salary,       // Overlay with specific salary data
            dateOfJoining: salary.dateOfJoining ? new Date(salary.dateOfJoining).toISOString().split('T')[0] : employeeData.dateOfJoining,
        });

    } catch (err) {
        console.error('[getSalarySlipById] Error fetching salary slip by ID:', err);
        next(err);
    }
};

// @desc    Delete a salary slip by ID (Admin only)
// @route   DELETE /api/salary/:id
// @access  Private (Admin)
exports.deleteSalarySlip = async (req, res, next) => {
    try {
        console.log(`[deleteSalarySlip] Deleting slip by ID: ${req.params.id}`);
        const salary = await Salary.findById(req.params.id);

        if (!salary) {
            // console.log(`[deleteSalarySlip] Salary slip with ID ${req.params.id} not found.`);
            return res.status(404).json({ message: 'Salary slip not found.' });
        }

        // Ensure only admin can delete (handled by authMiddleware too, but good to double-check)
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: Only administrators can delete salary slips.' });
        }

        await Salary.deleteOne({ _id: req.params.id });
        // console.log(`[deleteSalarySlip] Salary slip ${req.params.id} removed successfully.`);
        res.json({ message: 'Salary slip removed successfully' });

    } catch (err) {
        console.error('[deleteSalarySlip] Error deleting salary slip:', err);
        next(err);
    }
};

// @desc    Generate and download a specific salary slip PDF
// @route   GET /api/salary/download/:salaryId
// @access  Private (Admin or User)
exports.downloadSalarySlip = async (req, res, next) => {
    try {
        const { salaryId } = req.params;
        // console.log(`[downloadSalarySlip] Attempting to download slip ID: ${salaryId}`);

        const salary = await Salary.findById(salaryId).lean();

        if (!salary) {
            return res.status(404).json({ message: 'Salary slip not found.' });
        }

        // Authorization check
        if (req.user.role === 'user' && salary.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Forbidden: You can only download your own salary slips.' });
        }

        const user = await User.findById(salary.userId).populate('employeeDetails');
        let employeeData = {};
        if (user) {
            employeeData = getEmployeeDataFromUser(user);
        }

        const pdfData = { ...employeeData, ...salary }; // Combine employee and salary data for PDF
        const pdfBuffer = await generatePdf(pdfData); // Assuming generatePdf returns a Promise<Buffer>

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=${(employeeData.employeeName || 'SalarySlip').replace(/\s/g, '_')}_SalarySlip_${salary.month.replace(/\s/g, '_')}_${salary.year}.pdf`,
        });
        res.send(pdfBuffer);
        // console.log(`[downloadSalarySlip] PDF generated and sent for slip ID: ${salaryId}`);

    } catch (error) {
        console.error('[downloadSalarySlip] Error generating and downloading salary slip:', error);
        next(error);
    }
};

// @desc    Admin gets all salary slips with populated user data
// @route   GET /api/salary/all
// @access  Private (Admin)
exports.getAllSalarySlips = async (req, res, next) => {
    try {
        // console.log('[getAllSalarySlips] Attempting to fetch all salary slips for admin.');

        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: Only administrators can access this resource.' });
        }

        const salarySlips = await Salary.find({})
            .populate({
                path: 'userId',
                select: 'username email role employeeDetails',
                populate: {
                    path: 'employeeDetails',
                    model: 'EmployeeDetails' 
                }
            })
            .sort({ 'year': -1, 'monthNumeric': -1 })
            .lean(); 

        const formattedSalarySlips = salarySlips.map(slip => {
            const user = slip.userId;
            let employeeDataFromPopulatedUser = {};

            if (user && user.employeeDetails) {
                employeeDataFromPopulatedUser = getEmployeeDataFromUser(user);
            }

            return {
                ...employeeDataFromPopulatedUser, 
                ...slip, 
                userId: user?._id,
                email: user?.email, // Include email for list view
                dateOfJoining: slip.dateOfJoining ? new Date(slip.dateOfJoining).toISOString().split('T')[0] : employeeDataFromPopulatedUser.dateOfJoining,
            };
        });

        // console.log(`[getAllSalarySlips] Found ${formattedSalarySlips.length} slips.`);
        res.status(200).json({ salarySlips: formattedSalarySlips });
    } catch (error) {
        console.error('[getAllSalarySlips] SERVER ERROR:', error);
        next(error);
    }
};