import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './AddUser.css';

const AddUser = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        role: 'user',
        employeeDetails: {
            employeeName: '',
            empNo: '',
            designation: '',
            department: '',
            location: '',
            bankName: '',
            bankAccountNo: '',
            dateOfJoining: '',
            panNo: '',
            pfNo: '',
            pfUanNo: '',
            esicNo: '',
            aadharNo: '',
            gender: '',
            grade: '',
            vertical: '',
            division: '',
            paymentMode: '',
        },
    });
    const [loading, setLoading] = useState(false);
    const [loadingEmpNo, setLoadingEmpNo] = useState(true);
    const [nextAvailableEmpNo, setNextAvailableEmpNo] = useState('');

    const today = new Date().toISOString().split('T')[0];

    const fetchNextEmployeeNumber = useCallback(async () => {
        setLoadingEmpNo(true);
        try {
            const response = await api.get('/users');
            const users = response.data;

            let maxEmpNo = 0;
            users.forEach(user => {
                const currentEmpNo = parseInt(user.employeeDetails?.empNo, 10);
                if (!isNaN(currentEmpNo) && currentEmpNo > maxEmpNo) {
                    maxEmpNo = currentEmpNo;
                }
            });

            const newEmpNo = (maxEmpNo === 0 ? 1001 : maxEmpNo + 1).toString();
            setNextAvailableEmpNo(newEmpNo);
            setFormData(prevData => ({
                ...prevData,
                employeeDetails: {
                    ...prevData.employeeDetails,
                    empNo: newEmpNo
                }
            }));

        } catch (err) {
            console.error('Error fetching employee numbers:', err.response?.data?.message || err.message);
            toast.error('Failed to generate employee number. Please try again.');
            setNextAvailableEmpNo('1001'); 
            setFormData(prevData => ({
                ...prevData,
                employeeDetails: {
                    ...prevData.employeeDetails,
                    empNo: '1001'
                }
            }));
        } finally {
            setLoadingEmpNo(false);
        }
    }, []);

    useEffect(() => {
        fetchNextEmployeeNumber();
    }, [fetchNextEmployeeNumber]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name.startsWith('employeeDetails.')) {
            const field = name.split('.')[1];
            let newValue = value;

            if (field === 'bankAccountNo' || field === 'aadharNo') {
                newValue = value.replace(/\D/g, ''); 
            }

            setFormData(prevData => ({
                ...prevData,
                employeeDetails: {
                    ...prevData.employeeDetails,
                    [field]: newValue
                }
            }));
        } else {
            setFormData(prevData => ({
                ...prevData,
                [name]: value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (formData.employeeDetails.dateOfJoining && new Date(formData.employeeDetails.dateOfJoining) > new Date(today)) {
            toast.error('Date of Joining cannot be in the future.');
            setLoading(false);
            return; 
        }

        try {
            const dataToSend = {
                ...formData,
                employeeDetails: {
                    ...formData.employeeDetails,
                    empNo: nextAvailableEmpNo, 
                }
            };
            
            const res = await api.post('/auth/register', dataToSend);
            toast.success(res.data.message); 
            
            setFormData({
                username: '',
                email: '',
                role: 'user',
                employeeDetails: {
                    employeeName: '', empNo: '', designation: '', department: '',
                    location: '', bankName: '', bankAccountNo: '', dateOfJoining: '',
                    panNo: '', pfNo: '', pfUanNo: '', esicNo: '', aadharNo: '',
                    gender: '', grade: '', vertical: '', division: '', paymentMode: '',
                },
            });

            await fetchNextEmployeeNumber();

        } catch (err) {
            console.error('Error adding user:', err.response?.data?.message || err.message);
            toast.error(err.response?.data?.message || 'Failed to add user.'); 
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form-section">
            <div onClick={() => navigate('/admin/manage-users')}
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
                &larr; Back to User Management
            </div>
            <h2>Add New User</h2>
            <form onSubmit={handleSubmit}>
                <h3>Login Credentials</h3>
                <label className="input-label">
                    <span>Username*</span> 
                    <input type="text" name="username" value={formData.username} onChange={handleChange} required />
                </label>
                <label className="input-label">
                    <span>Email*</span> 
                    <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                </label>
                <label className="input-label">
                    <span>Role*</span> 
                    <select name="role" value={formData.role} onChange={handleChange} required>
                        <option value="user">User</option>
                    </select>
                </label>

                <h3>Employee Details</h3>
                <label className="input-label">
                    <span>Employee No (Auto-generated)</span>
                    {loadingEmpNo ? (
                        <span className="loading-text">Generating...</span>
                    ) : (
                        <input type="text" name="employeeDetails.empNo" value={nextAvailableEmpNo} readOnly className="read-only-input" />
                    )}
                </label>
                <label className="input-label">
                    <span>Employee Name*</span> 
                    <input type="text" name="employeeDetails.employeeName" value={formData.employeeDetails.employeeName} onChange={handleChange} required />
                </label>
                <label className="input-label">
                    <span>Designation*</span> 
                    <input type="text" name="employeeDetails.designation" value={formData.employeeDetails.designation} onChange={handleChange} required />
                </label>
                <label className="input-label">
                    <span>Department*</span> 
                    <input type="text" name="employeeDetails.department" value={formData.employeeDetails.department} onChange={handleChange} required />
                </label>
                <label className="input-label">
                    <span>Location*</span> 
                    <input type="text" name="employeeDetails.location" value={formData.employeeDetails.location} onChange={handleChange} required />
                </label>
                <label className="input-label">
                    <span>Bank Name*</span> 
                    <input type="text" name="employeeDetails.bankName" value={formData.employeeDetails.bankName} onChange={handleChange} required />
                </label>
                <label className="input-label">
                    <span>Bank Account No*</span> 
                    <input 
                        type="text" 
                        name="employeeDetails.bankAccountNo" 
                        value={formData.employeeDetails.bankAccountNo} 
                        onChange={handleChange} 
                        pattern="\d*" 
                        title="Only numbers are allowed" 
                        required 
                    />
                </label>
                <label className="input-label">
                    <span>Date of Joining*</span> 
                    <input 
                        type="date" 
                        name="employeeDetails.dateOfJoining" 
                        value={formData.employeeDetails.dateOfJoining} 
                        onChange={handleChange} 
                        max={today} 
                        required 
                    />
                </label>
                <label className="input-label">
                    <span>PAN No</span>
                    <input type="text" name="employeeDetails.panNo" value={formData.employeeDetails.panNo} onChange={handleChange} />
                </label>
                <label className="input-label">
                    <span>PF No</span>
                    <input type="text" name="employeeDetails.pfNo" value={formData.employeeDetails.pfNo} onChange={handleChange} />
                </label>
                <label className="input-label">
                    <span>PF UAN No</span>
                    <input type="text" name="employeeDetails.pfUanNo" value={formData.employeeDetails.pfUanNo} onChange={handleChange} />
                </label>
                <label className="input-label">
                    <span>ESIC No</span>
                    <input type="text" name="employeeDetails.esicNo" value={formData.employeeDetails.esicNo} onChange={handleChange} />
                </label>
                <label className="input-label">
                    <span>Aadhar No</span>
                    <input 
                        type="text" 
                        name="employeeDetails.aadharNo" 
                        value={formData.employeeDetails.aadharNo} 
                        onChange={handleChange} 
                        pattern="\d*" 
                        title="Only numbers are allowed" 
                    />
                </label>
                <label className="input-label">
                    <span>Gender*</span> 
                    <select name="employeeDetails.gender" value={formData.employeeDetails.gender} onChange={handleChange} required>
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                    </select>
                </label>
                <label className="input-label">
                    <span>Grade</span>
                    <input type="text" name="employeeDetails.grade" value={formData.employeeDetails.grade} onChange={handleChange} />
                </label>
                <label className="input-label">
                    <span>Vertical</span>
                    <input type="text" name="employeeDetails.vertical" value={formData.employeeDetails.vertical} onChange={handleChange} />
                </label>
                <label className="input-label">
                    <span>Division</span>
                    <input type="text" name="employeeDetails.division" value={formData.employeeDetails.division} onChange={handleChange} />
                </label>
                <label className="input-label">
                    <span>Payment Mode</span>
                    <select name="employeeDetails.paymentMode" value={formData.employeeDetails.paymentMode} onChange={handleChange}>
                        <option value="">Select Mode</option>
                        <option value="CASH">CASH</option>
                        <option value="CHECK">CHECK</option>
                        <option value="NEFT">NEFT</option>
                        <option value="RTGS">RTGS</option>
                        <option value="OTHER">OTHER</option>
                    </select>
                </label>

                <button type="submit" disabled={loading || loadingEmpNo}>
                    {loading ? <span className="spinner"></span> : 'Add User'}
                </button>
            </form>
            <button onClick={() => navigate('/admin/dashboard')} className="back-button">Back to Dashboard</button>
            <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
        </div>
    );
};

export default AddUser;