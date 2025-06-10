import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify'; 
import 'react-toastify/dist/ReactToastify.css'; 
import './ResetPassword.css';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const email = searchParams.get('email');
    const navigate = useNavigate();

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState(''); 

    const handleReset = async () => {
        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match'); 
            return;
        }

        if (newPassword.length < 6) {
            toast.error('Password must be at least 6 characters long'); 
            return;
        }

        try {
            const res = await fetch('http://localhost:5000/api/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password: newPassword }),
            });

            const data = await res.json();
            
            if (res.ok) { 
                toast.success(data.message || 'Password reset successful!');
                setTimeout(() => {
                    navigate('/login/user'); 
                }, 1000); 
            } else {
                toast.error(data.message || 'Error resetting password.'); 
            }
        } catch (err) {
            console.error('Error during password reset fetch:', err);
            toast.error('Network error or server unavailable. Please try again.'); 
        }
    };

    return (
        <div className="reset-container">
            <h2>Reset Password</h2>
            <p>Resetting for: <strong>{email}</strong></p>
            <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength="6"
            />
            <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength="6"
            />
            <button onClick={handleReset}>Reset Password</button>
            <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
        </div>
    );
};

export default ResetPassword;
