import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; 
import api from '../../lib/api';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './AdminDashboard.css';

const AdminUserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate(); 

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);


    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await api.get('/users');
            const filteredUsers = response.data.filter(user => user.role !== 'admin');
            setUsers(filteredUsers);
        } catch (err) {
            console.error('Error fetching users:', err.response?.data?.message || err.message);
            toast.error(err.response?.data?.message || 'Failed to fetch users.');
        } finally {
            setLoading(false);
        }
    };

    const confirmDeleteUser = (userId) => {
        setUserToDelete(userId);
        setShowConfirmModal(true);
    };

    const handleCancelDelete = () => {
        setShowConfirmModal(false);
        setUserToDelete(null);
    };

    const handleConfirmDelete = async () => {
        setShowConfirmModal(false);
        if (!userToDelete) return;

        try {
            const response = await api.delete(`/users/${userToDelete}`);
            toast.success(response.data.message);
            fetchUsers();
        } catch (err) {
            console.error('Error deleting user:', err.response?.data?.message || err.message);
            if (err.response && err.response.status === 403) {
                toast.error('Cannot delete your own admin account through this interface.');
            } else {
                toast.error(err.response?.data?.message || 'Failed to delete user.');
            }
        } finally {
            setUserToDelete(null);
        }
    };


    if (loading) {
        return (
            <div className="dashboard-container loading-state">
                <p>Loading users...</p>
                <span className="spinner"></span>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <div onClick={() => navigate('/admin/dashboard')}
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

            <div className="dashboard-header">
                <h2>User Management</h2>
                <Link to="/admin/users/add" className="button add-user-button">Add New User</Link>
            </div>


            {users.length === 0 ? (
                <p className="empty-list-message">No non-admin users found. Click "Add New User" to get started.</p>
            ) : (
                <ul className="user-list">
                    {users.map(user => (
                        <li key={user._id}>
                            <div className="user-info">
                                <strong>{user.employeeDetails?.employeeName || user.username}</strong>
                                <span>Email: {user.email}</span>
                                <span>Role: {user.role}</span>
                                {user.employeeDetails?.empNo && (
                                    <span>Emp No: {user.employeeDetails.empNo}</span>
                                )}
                                {user.employeeDetails?.designation && (
                                    <span>Designation: {user.employeeDetails.designation}</span>
                                )}
                                {user.employeeDetails?.department && (
                                    <span>Department: {user.employeeDetails.department}</span>
                                )}
                            </div>
                            <div className="user-actions">
                                <Link to={`/admin/users/edit/${user._id}`} className="button edit-btn">
                                    Edit User
                                </Link>
                                <button onClick={() => confirmDeleteUser(user._id)} className="delete-btn">
                                    Delete User
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {showConfirmModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Confirm Deletion</h3>
                        <p>Are you sure you want to delete this user? This action cannot be undone.</p>
                        <div className="modal-actions">
                            <button onClick={handleConfirmDelete} className="button delete-btn">Confirm Delete</button>
                            <button onClick={handleCancelDelete} className="button cancel-btn">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
            <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
        </div>
    );
};

export default AdminUserManagement;
