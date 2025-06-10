import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './AdminSalaryForm.css';

function AdminSalaryForm() {
    const { userId } = useParams();
    const navigate = useNavigate();

    const initialFormData = {
        companyName: 'VIKARTR TECHNOLOGIES',
        employeeName: '',
        empNo: '',
        employeeEmail: '',
        dateOfJoining: '',
        panNo: '',
        pfNo: '',
        pfUanNo: '',
        esicNo: '',
        aadharNo: '',
        gender: '',
        designation: '',
        department: '',
        grade: '',
        vertical: '',
        division: '',
        location: '',
        paymentMode: '',
        bankName: '',
        bankAccountNo: '',
        totalNumberOfDays: 30,
        workingDays: 0,
        paidDays: 0,
        lopDays: 0,
        refundDays: 0,
        arrearDays: 0,
        earnings: {
            basic: 0,
            dearnessAllowance: 0,
            houseRentAllowance: 0,
            conveyanceAllowance: 0,
            medicalAllowance: 0,
            specialAllowance: 0,
            uniformAllowance: 0,
            internetAllowance: 0,
            fuelAllowance: 0,
            childrenEducationAllowance: 0,
            otherAllowance: 0,
        },
        deductions: {
            professionalTax: 0,
            taxDeductedAtSource: 0,
            employeeProvidentFund: 0,
            lwf: 0,
            leave: 0,
        },
        salaryCtc: 0,
    };

    const [formData, setFormData] = useState(initialFormData);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toLocaleString('en-US', { month: 'long' }));
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [salaryId, setSalaryId] = useState(null);

    const [calculatedGross, setCalculatedGross] = useState(0);
    const [calculatedTotalDeduction, setCalculatedTotalDeduction] = useState(0);
    const [calculatedNetSalary, setCalculatedNetSalary] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditMode, setIsEditMode] = useState(false);

    const currentMonthIndex = new Date().getMonth();
    const currentYearValue = new Date().getFullYear();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const calculateSalary = useCallback(() => {
        const totalEarnings = Object.values(formData.earnings).reduce((sum, value) => sum + parseFloat(value || 0), 0);
        const totalDeductions = Object.values(formData.deductions).reduce((sum, value) => sum + parseFloat(value || 0), 0);

        setCalculatedGross(totalEarnings);
        setCalculatedTotalDeduction(totalDeductions);
        setCalculatedNetSalary(totalEarnings - totalDeductions);
    }, [formData.earnings, formData.deductions]);

    useEffect(() => {
        calculateSalary();
    }, [calculateSalary]);

    useEffect(() => {
        const fetchUserDataAndSalary = async () => {
            if (!userId) {
                setIsLoading(false);
                toast.error('User ID is missing in URL. Please go back to the user list.');
                return;
            }

            setIsLoading(true);
            setSalaryId(null);

            try {
                const userResponse = await api.get(`/users/${userId}`);
                const userData = userResponse.data;
                const employeeDetails = userData.employeeDetails || {};

                const employeeName = employeeDetails.employeeName ||
                    `${employeeDetails.firstName || ''} ${employeeDetails.lastName || ''}`.trim() ||
                    userData.username || '';

                let baseEmployeeProfileData = {
                    companyName: 'VIKARTR TECHNOLOGIES',
                    employeeName: employeeName,
                    empNo: employeeDetails.empNo || '',
                    employeeEmail: userData.email || '',
                    dateOfJoining: employeeDetails.dateOfJoining ? new Date(employeeDetails.dateOfJoining).toISOString().split('T')[0] : '',
                    panNo: employeeDetails.panNo || '',
                    pfNo: employeeDetails.pfNo || '',
                    pfUanNo: employeeDetails.pfUanNo || '',
                    esicNo: employeeDetails.esicNo || '',
                    aadharNo: employeeDetails.aadharNo || '',
                    gender: employeeDetails.gender || '',
                    designation: employeeDetails.designation || '',
                    department: employeeDetails.department || '',
                    grade: employeeDetails.grade || '',
                    vertical: employeeDetails.vertical || '',
                    division: employeeDetails.division || '',
                    location: employeeDetails.location || '',
                    paymentMode: employeeDetails.paymentMode || '',
                    bankName: employeeDetails.bankName || '',
                    bankAccountNo: employeeDetails.bankAccountNo || '',
                    salaryCtc: employeeDetails.salaryCtc || 0,
                };

                try {
                    const salaryResponse = await api.get(`/salary/${userId}/period?month=${selectedMonth}&year=${selectedYear}`);
                    const salaryData = salaryResponse.data;

                    setSalaryId(salaryData._id);
                    setIsEditMode(true);

                    setFormData(prev => ({
                        ...initialFormData,
                        ...baseEmployeeProfileData,
                        ...salaryData,
                        earnings: { ...initialFormData.earnings, ...salaryData.earnings },
                        deductions: { ...initialFormData.deductions, ...salaryData.deductions },
                        dateOfJoining: salaryData.dateOfJoining ? new Date(salaryData.dateOfJoining).toISOString().split('T')[0] : baseEmployeeProfileData.dateOfJoining,
                    }));
                    toast.info(`Existing salary slip for ${selectedMonth}, ${selectedYear} loaded. You can now edit its details.`);

                } catch (salaryError) {
                    if (salaryError.response && salaryError.response.status === 404) {
                        setSalaryId(null);
                        setIsEditMode(false);

                        try {
                            const recentSalaryResponse = await api.get(`/salary/${userId}/recent`);
                            const recentSalaryData = recentSalaryResponse.data;
                            toast.info(`No slip for ${selectedMonth}, ${selectedYear}. Pre-populating with details from most recent slip (${recentSalaryData.month} ${recentSalaryData.year}).`);

                            setFormData(prev => ({
                                ...initialFormData,
                                ...baseEmployeeProfileData,
                                earnings: { ...initialFormData.earnings, ...recentSalaryData.earnings },
                                deductions: { ...initialFormData.deductions, ...recentSalaryData.deductions },
                                totalNumberOfDays: recentSalaryData.totalNumberOfDays || 30,
                                workingDays: recentSalaryData.workingDays || 0,
                                paidDays: recentSalaryData.paidDays || 0,
                                lopDays: recentSalaryData.lopDays || 0,
                                refundDays: recentSalaryData.refundDays || 0,
                                arrearDays: recentSalaryData.arrearDays || 0,
                                salaryCtc: recentSalaryData.salaryCtc || 0,
                            }));
                        } catch (recentSalaryError) {
                            toast.info(`No existing or recent salary slip found. Creating a new one for ${selectedMonth}, ${selectedYear}.`);
                            setFormData(prev => ({
                                ...initialFormData,
                                ...baseEmployeeProfileData,
                                earnings: { ...initialFormData.earnings },
                                deductions: { ...initialFormData.deductions },
                            }));
                        }
                    } else {
                        console.error('Error fetching specific salary slip:', salaryError.response?.data?.message || salaryError.message);
                        toast.error('Failed to load salary slip: ' + (salaryError.response?.data?.message || salaryError.message));
                        setFormData(prev => ({
                            ...initialFormData,
                            ...baseEmployeeProfileData,
                            earnings: { ...initialFormData.earnings },
                            deductions: { ...initialFormData.deductions },
                        }));
                        setIsEditMode(false);
                    }
                }

            } catch (userErr) {
                console.error('Error fetching user data:', userErr.response?.data?.message || userErr.message);
                toast.error('Failed to load user details. Please try again: ' + (userErr.response?.data?.message || userErr.message));
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserDataAndSalary();
    }, [userId, selectedMonth, selectedYear, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        const parseNumericValue = (val) => {
            if (val === '') {
                return '';
            }
            const num = parseFloat(val);
            return isNaN(num) ? 0 : num;
        };

        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: parseNumericValue(value)
                }
            }));
        } else {
            if (['totalNumberOfDays', 'workingDays', 'paidDays', 'lopDays', 'refundDays', 'arrearDays', 'salaryCtc'].includes(name)) {
                setFormData(prev => ({
                    ...prev,
                    [name]: parseNumericValue(value)
                }));
            } else {
                setFormData(prev => ({
                    ...prev,
                    [name]: value
                }));
            }
        }
    };

    const handleMonthChange = (e) => {
        const newMonth = e.target.value;
        setSelectedMonth(newMonth);
    };

    const handleYearChange = (e) => {
        const newYear = parseInt(e.target.value);
        
        if (newYear > currentYearValue) {
            toast.warn("Cannot select a future year.");
            return;
        }
        if (newYear === currentYearValue) {
            const selectedMonthIndex = monthNames.indexOf(selectedMonth);
            if (selectedMonthIndex > currentMonthIndex) {
                toast.warn("Cannot select a future month for the current year. Reverting to current month.");
                setSelectedMonth(monthNames[currentMonthIndex]);
            }
        }
        setSelectedYear(newYear.toString());
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const dataToSubmit = {
                ...formData,
                month: selectedMonth,
                year: selectedYear,
                grossSalary: calculatedGross,
                totalDeductions: calculatedTotalDeduction,
                netSalary: calculatedNetSalary,
                earnings: Object.fromEntries(
                    Object.entries(formData.earnings).map(([key, val]) => [key, parseFloat(val || 0)])
                ),
                deductions: Object.fromEntries(
                    Object.entries(formData.deductions).map(([key, val]) => [key, parseFloat(val || 0)])
                ),
                totalNumberOfDays: parseFloat(formData.totalNumberOfDays || 0),
                workingDays: parseFloat(formData.workingDays || 0),
                paidDays: parseFloat(formData.paidDays || 0),
                lopDays: parseFloat(formData.lopDays || 0),
                refundDays: parseFloat(formData.refundDays || 0),
                arrearDays: parseFloat(formData.arrearDays || 0),
                salaryCtc: parseFloat(formData.salaryCtc || 0),
            };

            let response;
            if (isEditMode && salaryId) {
                const confirmUpdate = window.confirm(`Are you sure you want to update the salary slip for ${selectedMonth}, ${selectedYear}?`);
                if (!confirmUpdate) {
                    setIsLoading(false);
                    return;
                }
                response = await api.put(`/salary/${salaryId}`, dataToSubmit);
                toast.success('Salary slip updated successfully!');
            } else {
                const selectedDate = new Date(parseInt(selectedYear), monthNames.indexOf(selectedMonth), 1);
                const today = new Date();
                today.setDate(1);

                if (selectedDate > today) {
                    toast.error("Cannot create a salary slip for a future month or year.");
                    setIsLoading(false);
                    return;
                }

                response = await api.post(`/salary/${userId}`, dataToSubmit);
                toast.success('Salary slip added successfully!');
                setSalaryId(response.data.salary._id);
                setIsEditMode(true);
            }
            console.log('Salary slip saved:', response.data);
            navigate('/admin/manage-salaries');
        } catch (err) {
            console.error('Error saving salary slip:', err.response?.data?.message || err.message);
            toast.error('Failed to save salary slip: ' + (err.response?.data?.message || err.message));
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <div className="admin-salary-form-container">Loading salary slip...</div>;
    }

    const currentYear = new Date().getFullYear();
    const availableYears = [currentYear]; 
    const availableMonths = [];
    for (let i = 0; i < 3; i++) { 
        let monthIndex = currentMonthIndex - i;
        let yearForMonth = currentYearValue;

        if (monthIndex < 0) {
            monthIndex += 12; 
            yearForMonth--;
        }

        if (availableYears.includes(yearForMonth)) {
            availableMonths.push(monthNames[monthIndex]);
        }
    }
    const uniqueAvailableMonths = [...new Set(availableMonths)].sort((a,b) => monthNames.indexOf(a) - monthNames.indexOf(b));


    return (
        <div className="admin-salary-form-container">
            <div className="back-to-dashboard" onClick={() => navigate('/admin/manage-salaries')}
                style={{
                    top: '20px',
                    left: '20px',
                    fontSize: '1.1em',
                    fontWeight: '1000',
                    color: 'blueviolet',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    transition: 'color 0.2s ease, transform 0.2s ease'
                }}>
                &larr; Back to Salary Management
            </div>
            <h2 className="salary-form-header">
                {isEditMode ? 'Edit Salary Slip' : 'Add New Salary Slip'} for {formData.employeeName}
            </h2>

            <form onSubmit={handleSubmit} className="salary-form">
                <section className="form-section salary-period-top">
                    <div className="form-group inline-group">
                        <label>Month:</label>
                        <select value={selectedMonth} onChange={handleMonthChange}>
                            {uniqueAvailableMonths.map((month) => (
                                <option key={month} value={month}>{month}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group inline-group">
                        <label>Year:</label>
                        <select value={selectedYear} onChange={handleYearChange}>
                            {availableYears.map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>
                </section>

                <section className="form-section company-info">
                    <h3>Company Information</h3>
                    <div className="form-group full-width">
                        <label>Company Name*</label>
                        <input
                            type="text"
                            name="companyName"
                            value={formData.companyName}
                            onChange={handleChange}
                            readOnly
                        />
                    </div>
                </section>

                <section className="form-section employee-profile">
                    <h3>Employee Profile</h3>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Employee Name*</label>
                            <input type="text" name="employeeName" value={formData.employeeName} onChange={handleChange} readOnly />
                        </div>
                        <div className="form-group">
                            <label>Employee No*</label>
                            <input type="text" name="empNo" value={formData.empNo} onChange={handleChange} readOnly />
                        </div>
                        <div className="form-group">
                            <label>Employee Email*</label>
                            <input type="email" name="employeeEmail" value={formData.employeeEmail} onChange={handleChange} readOnly />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Date of Joining*</label>
                            <input type="date" name="dateOfJoining" value={formData.dateOfJoining} onChange={handleChange} readOnly />
                        </div>
                        <div className="form-group">
                            <label>Gender*</label>
                            <input type="text" name="gender" value={formData.gender} onChange={handleChange} readOnly />
                        </div>
                        <div className="form-group">
                            <label>Designation*</label>
                            <input type="text" name="designation" value={formData.designation} onChange={handleChange} readOnly />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Department*</label>
                            <input type="text" name="department" value={formData.department} onChange={handleChange} readOnly />
                        </div>
                        <div className="form-group">
                            <label>Location*</label>
                            <input type="text" name="location" value={formData.location} onChange={handleChange} readOnly />
                        </div>
                        <div className="form-group">
                            <label>Bank Name*</label>
                            <input type="text" name="bankName" value={formData.bankName} onChange={handleChange} readOnly />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Bank Account No*</label>
                            <input type="text" name="bankAccountNo" value={formData.bankAccountNo} onChange={handleChange} readOnly />
                        </div>
                    </div>
                    <div className="form-group full-width">
                        <label>Salary CTC (Annual)*</label>
                        <input type="number" name="salaryCtc" value={formData.salaryCtc} onChange={handleChange} readOnly/>
                    </div>
                </section>

                <section className="form-section salary-days">
                    <h3>Days Information</h3>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Total Days in Month*</label>
                            <input type="number" name="totalNumberOfDays" value={formData.totalNumberOfDays} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>Working Days*</label>
                            <input type="number" name="workingDays" value={formData.workingDays} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>Paid Days</label>
                            <input type="number" name="paidDays" value={formData.paidDays} onChange={handleChange} />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>LOP Days</label>
                            <input type="number" name="lopDays" value={formData.lopDays} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Refund Days</label>
                            <input type="number" name="refundDays" value={formData.refundDays} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Arrear Days</label>
                            <input type="number" name="arrearDays" value={formData.arrearDays} onChange={handleChange} />
                        </div>
                    </div>
                </section>

                <section className="form-section earnings">
                    <h3>Earnings</h3>
                    <div className="form-row">
                        {Object.keys(initialFormData.earnings).map((key, index) => (
                            <React.Fragment key={key}>
                                <div className="form-group">
                                    <label>
                                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                        {key === 'basic' && '*'}
                                    </label>
                                    <input
                                        type="number"
                                        name={`earnings.${key}`}
                                        value={formData.earnings[key]}
                                        onChange={handleChange}
                                        required={key === 'basic'}
                                    />
                                </div>
                                {(index + 1) % 3 === 0 && index !== Object.keys(initialFormData.earnings).length - 1 && (
                                    <div className="form-row-break"></div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </section>

                <section className="form-section deductions">
                    <h3>Deductions</h3>
                    <div className="form-row">
                        {Object.keys(initialFormData.deductions).map((key, index) => (
                            <React.Fragment key={key}>
                                <div className="form-group">
                                    <label>
                                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                        {key === 'professionalTax' && '*'}
                                    </label>
                                    <input
                                        type="number"
                                        name={`deductions.${key}`}
                                        value={formData.deductions[key]}
                                        onChange={handleChange}
                                        required={key === 'professionalTax'}
                                    />
                                </div>
                                {(index + 1) % 3 === 0 && index !== Object.keys(initialFormData.deductions).length - 1 && (
                                    <div className="form-row-break"></div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </section>

                <section className="form-section salary-summary">
                    <h3>Salary Summary</h3>
                    <div className="summary-item">
                        <strong>Gross Salary:</strong> <span>{calculatedGross.toFixed(2)}</span>
                    </div>
                    <div className="summary-item">
                        <strong>Total Deductions:</strong> <span>{calculatedTotalDeduction.toFixed(2)}</span>
                    </div>
                    <div className="summary-item net-salary">
                        <strong>Net Salary Payable:</strong> <span>{calculatedNetSalary.toFixed(2)}</span>
                    </div>
                </section>

                <button type="submit" className="submit-button" disabled={isLoading}>
                    {isLoading ? <span className="spinner"></span> : (isEditMode ? 'Update Salary Slip' : 'Add Salary Slip')}
                </button>
            </form>
            <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
        </div>
    );
}

export default AdminSalaryForm;