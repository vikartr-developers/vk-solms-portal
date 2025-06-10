import React, { useState } from 'react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify'; 
import 'react-toastify/dist/ReactToastify.css'; 
// import './ChangePassword.css'; 

const ChangePassword = () => {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (newPassword !== confirmNewPassword) {
            toast.error('New password and confirm new password do not match.'); 
            setLoading(false);
            return;
        }

        if (newPassword.length < 6) { 
            toast.error('New password must be at least 6 characters long.');
            setLoading(false);
            return;
        }

        try {
            const res = await api.put('/auth/change-password', { oldPassword, newPassword });
            toast.success(res.data.message || 'Password changed successfully!'); 
            setOldPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
            if (user && user.role === 'user') { 
                setTimeout(() => {
                    logout();
                    navigate('/login/user', { replace: true });
                }, 1000); 
            }
        } catch (err) {
            console.error('Password change error:', err.response?.data?.message || err.message);
            toast.error(err.response?.data?.message || 'Failed to change password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container"> 
            <h2>Change Password</h2>
            <form onSubmit={handleSubmit}>
                <label>
                    Old Password:
                    <input
                        type="password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        required
                    />
                </label>
                <label>
                    New Password:
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength="6"
                    />
                </label>
                <label>
                    Confirm New Password:
                    <input
                        type="password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        required
                        minLength="6"
                    />
                </label>
                <button type="submit" disabled={loading}>
                    {loading ? <span className="spinner"></span> : 'Change Password'}
                </button>
            </form>
            <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
        </div>
    );
};

export default ChangePassword;
