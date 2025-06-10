import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './ForgotPassword.css'; 

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (!email) {
            toast.error('Please enter your email address.');
            setLoading(false);
            return;
        }

        try {
            const res = await fetch('http://localhost:5000/api/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();
            
            if (res.ok) {
                toast.success(data.message || 'Password reset link sent to your email!');
                setEmail(''); 
                setTimeout(() => {
                    navigate('/login/user'); 
                }, 1000); 
            } else {
                toast.error(data.message || 'Error sending reset link. Please check the email address.');
            }
        } catch (err) {
            console.error('Error during forgot password fetch:', err);
            toast.error('Network error or server unavailable. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="forgot-password-container">
            <div onClick={() => navigate('/login/user')}
                style={{
                    position: 'absolute',
                    top: '20px',
                    left: '20px',
                    fontSize: '1.1em',
                    fontWeight: '1000',
                    color: 'blueviolet',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    transition: 'color 0.2s ease, transform 0.2s ease'
                }}>
                &larr; Back to Login
            </div>
            <h2>Forgot Password</h2>
            <p>Enter your email address to receive a password reset link.</p>
            <form onSubmit={handleForgotPassword}>
                <label>
                    Email:
                    <input
                        type="email"
                        placeholder="your-email@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </label>
                <button type="submit" disabled={loading}>
                    {loading ? <span className="spinner"></span> : 'Send Reset Link'}
                </button>
            </form>
            <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
        </div>
    );
};

export default ForgotPassword;
