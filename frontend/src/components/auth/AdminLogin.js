import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoginForm from './LoginForm';

const AdminLogin = () => {
    const { login, user } = useAuth();
    const navigate = useNavigate();

    if (user && user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
        return null;
    }

    const handleAdminLogin = async (email, password) => {
        const result = await login(email, password, 'admin');
        if (result.success) {
            navigate('/admin/dashboard');
        }
        return result;
    };

    return <LoginForm onSubmit={handleAdminLogin} role="admin" />;
};

export default AdminLogin;