import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './LoginForm.css';
import './AdminLogin.css';

const LoginForm = ({ onSubmit, role }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const result = await onSubmit(email, password);
        setLoading(false);

        if (result.success) {
            toast.success(`Successfully logged in as ${role === 'admin' ? 'Admin' : 'User'}!`);
            setTimeout(() => {
                setEmail('');
                setPassword('');
            }, 1000);
        } else {
            toast.error(result.message || 'Login failed. Please check your credentials.');
        }
    };

    return (
        <div className="login-container">
            <h2>{role === 'admin' ? 'Admin Login' : 'User Login'}</h2>
            <form onSubmit={handleSubmit}>
                <label>
                    Email:
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </label>
                <label>
                    Password:
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </label>
                <button type="submit" disabled={loading}>
                    {loading ? <span className="spinner"></span> : 'Login'}
                </button>
            </form>

            <p
                className="forgot-password"
                style={{ color: '#007bff', cursor: 'pointer', marginTop: '10px' }}
                onClick={() => navigate('/forgot-password')}
            >
                Forgot Password?
            </p>

            <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
        </div>
    );
};

export default LoginForm;