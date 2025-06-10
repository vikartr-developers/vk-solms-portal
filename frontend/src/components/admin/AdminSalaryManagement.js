import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import './AdminDashboard.css';

const AdminSalaryManagement = () => {
    const [users, setUsers] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await api.get('/users');
            const filteredUsers = response.data.filter(user => user.role !== 'admin');
            setUsers(filteredUsers);
        } catch (err) {
            console.error('Error fetching users for salary management:', err.response?.data?.message || err.message);
            setError('Failed to fetch users for salary management.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="dashboard-container">Loading users...</div>;
    }

    return (
        <div className="dashboard-container">
            <div  onClick={() => navigate('/admin/dashboard')}
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
                &larr; Go to Dashboard
            </div>
            <h2 className="dashboard-header">Salary Slip Management</h2>
            {error && <p className="error-message">{error}</p>}

            {users.length === 0 ? (
                <p>No users found to manage salary slips for. Please add users first.</p>
            ) : (
                <ul className="user-list">
                    {users.map(user => (
                        <li key={user._id}>
                            <div className="user-info">
                                <strong>{user.employeeDetails?.employeeName || user.username}</strong>
                                <span>Email: {user.email}</span>
                                {user.employeeDetails?.empNo && <span>Emp No: {user.employeeDetails.empNo}</span>}
                            </div>
                            <div className="user-actions">
                                <Link to={`/admin/salary/add/${user._id}`} className="form-section button edit-btn">
                                    Add/Edit Salary Slip
                                </Link>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default AdminSalaryManagement;