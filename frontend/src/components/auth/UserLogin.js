import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoginForm from './LoginForm';

const UserLogin = () => {
    const { login, user } = useAuth();
    const navigate = useNavigate();

    if (user && user.role === 'user') {
        navigate('/user/dashboard', { replace: true });
        return null;
    }

    const handleUserLogin = async (email, password) => {
        const result = await login(email, password, 'user');
        if (result.success) {
            navigate('/user/dashboard');
        }
        return result;
    };

    return <LoginForm onSubmit={handleUserLogin} role="user" />;
};

export default UserLogin;