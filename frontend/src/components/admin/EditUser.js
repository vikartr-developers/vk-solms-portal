import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const EditUser = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        role: '',
        employeeDetails: {
            employeeName: '', empNo: '', designation: '', department: '',
            location: '', bankName: '', bankAccountNo: '', dateOfJoining: '',
            panNo: '', pfNo: '', pfUanNo: '', esicNo: '', aadharNo: '',
            gender: '', grade: '', vertical: '', division: '', paymentMode: '',
        },
    });
    const [loading, setLoading] = useState(true);

    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await api.get(`/users/${id}`);
                const userData = response.data;

                const formattedDateOfJoining = userData.employeeDetails.dateOfJoining
                    ? new Date(userData.employeeDetails.dateOfJoining).toISOString().split('T')[0]
                    : '';

                setFormData({
                    username: userData.username,
                    email: userData.email,
                    role: userData.role,
                    employeeDetails: {
                        ...userData.employeeDetails,
                        dateOfJoining: formattedDateOfJoining,
                    },
                });
            } catch (err) {
                console.error('Error fetching user for edit:', err.response?.data?.message || err.message);
                toast.error('Failed to load user data.');
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, [id]);

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

        if (formData.employeeDetails.dateOfJoining && new Date(formData.employeeDetails.dateOfJoining) > new Date(today)) {
            toast.error('Date of Joining cannot be in the future.');
            return; 
        }

        const confirmUpdate = window.confirm("Are you sure you want to update these details?");
        if (!confirmUpdate) {
            return; 
        }

        setLoading(true);

        try {
            const dataToSend = {
                ...formData,
                employeeDetails: {
                    ...formData.employeeDetails,
                    dateOfJoining: formData.employeeDetails.dateOfJoining
                        ? new Date(formData.employeeDetails.dateOfJoining).toISOString()
                        : null,
                }
            };

            const res = await api.put(`/users/${id}`, dataToSend);
            toast.success(res.data.message || 'User updated successfully!');
        } catch (err) {
            console.error('Error updating user:', err.response?.data?.message || err.message);
            toast.error(err.response?.data?.message || 'Failed to update user. Please check your inputs.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="form-section">Loading user data...</div>;
    }

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
            <h2>Edit User {formData.employeeDetails.employeeName || formData.username}</h2>
            <form onSubmit={handleSubmit}>
                <h3>Login Credentials</h3>
                <label>
                    Username
                    <input type="text" name="username" value={formData.username} onChange={handleChange} required />
                </label>
                <label>
                    Email
                    <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                </label>
                <label>
                    Role
                    <select name="role" value={formData.role} onChange={handleChange} required>
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                    </select>
                </label>

                <h3>Employee Details</h3>
                <label>
                    Employee Name
                    <input type="text" name="employeeDetails.employeeName" value={formData.employeeDetails.employeeName} onChange={handleChange} required />
                </label>
                <label>
                    Employee No
                    <input type="text" name="employeeDetails.empNo" value={formData.employeeDetails.empNo} onChange={handleChange} readOnly />
                </label>
                <label>
                    Designation
                    <input type="text" name="employeeDetails.designation" value={formData.employeeDetails.designation} onChange={handleChange} />
                </label>
                <label>
                    Department
                    <input type="text" name="employeeDetails.department" value={formData.employeeDetails.department} onChange={handleChange} />
                </label>
                <label>
                    Location
                    <input type="text" name="employeeDetails.location" value={formData.employeeDetails.location} onChange={handleChange} />
                </label>
                <label>
                    Bank Name
                    <input type="text" name="employeeDetails.bankName" value={formData.employeeDetails.bankName} onChange={handleChange} />
                </label>
                <label>
                    Bank Account No
                    <input
                        type="text"
                        name="employeeDetails.bankAccountNo"
                        value={formData.employeeDetails.bankAccountNo}
                        onChange={handleChange}
                        pattern="\d*"
                        title="Only numbers are allowed"
                    />
                </label>
                <label>
                    Date of Joining
                    <input
                        type="date"
                        name="employeeDetails.dateOfJoining"
                        value={formData.employeeDetails.dateOfJoining}
                        onChange={handleChange}
                        max={today}
                    />
                </label>
                <label>
                    PAN No
                    <input type="text" name="employeeDetails.panNo" value={formData.employeeDetails.panNo} onChange={handleChange} />
                </label>
                <label>
                    PF No
                    <input type="text" name="employeeDetails.pfNo" value={formData.employeeDetails.pfNo} onChange={handleChange} />
                </label>
                <label>
                    PF UAN No
                    <input type="text" name="employeeDetails.pfUanNo" value={formData.employeeDetails.pfUanNo} onChange={handleChange} />
                </label>
                <label>
                    ESIC No
                    <input type="text" name="employeeDetails.esicNo" value={formData.employeeDetails.esicNo} onChange={handleChange} />
                </label>
                <label>
                    Aadhar No
                    <input
                        type="text"
                        name="employeeDetails.aadharNo"
                        value={formData.employeeDetails.aadharNo}
                        onChange={handleChange}
                        pattern="\d*"
                        title="Only numbers are allowed"
                    />
                </label>
                <label>
                    Gender
                    <select name="employeeDetails.gender" value={formData.employeeDetails.gender} onChange={handleChange}>
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                    </select>
                </label>
                <label>
                    Grade
                    <input type="text" name="employeeDetails.grade" value={formData.employeeDetails.grade} onChange={handleChange} />
                </label>
                <label>
                    Vertical
                    <input type="text" name="employeeDetails.vertical" value={formData.employeeDetails.vertical} onChange={handleChange} />
                </label>
                <label>
                    Division
                    <input type="text" name="employeeDetails.division" value={formData.employeeDetails.division} onChange={handleChange} />
                </label>
                <label>
                    Payment Mode
                    <input type="text" name="employeeDetails.paymentMode" value={formData.employeeDetails.paymentMode} onChange={handleChange} />
                </label>

                <button type="submit" disabled={loading}>
                    {loading ? <span className="spinner"></span> : 'Update User'}
                </button>
            </form>
            <button onClick={() => navigate('/admin/dashboard')} className="back-button">Back to Dashboard</button>
            <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
        </div>
    );
};

export default EditUser;