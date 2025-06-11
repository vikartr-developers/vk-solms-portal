import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AdminLogin from './components/auth/AdminLogin';
import UserLogin from './components/auth/UserLogin';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminUserManagement from './components/admin/AdminUserManagement';
import AdminSalaryManagement from './components/admin/AdminSalaryManagement';
import AdminOfferLetterManagement from './components/admin/AdminOfferLetterManagement';
import UserDashboard from './components/user/UserDashboard';
import ChangePassword from './components/auth/ChangePassword';
import AddUser from './components/admin/AddUser';
import EditUser from './components/admin/EditUser';
import AdminSalaryForm from './components/admin/AdminSalaryForm';
import AdminOfferLetterForm from './components/admin/AdminOfferLetterForm'; 
import Header from './components/layout/Header';
import ResetPassword from './components/auth/ResetPassword'; 
import ForgotPassword from './components/auth/ForgotPassword';

const PrivateRoute = ({ children, roles }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div>Loading...</div>; 
    }

    if (!user) {
        return <Navigate to="/login/user" replace />; 
    }

    if (roles && !roles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }

    return children;
};

function App() {
    return (
        <Router>
            <div className="App">
                <Header /> 
                <Routes>
                    <Route path="/" element={<Navigate to="/login/user" replace />} /> 
                    <Route path="/login/admin" element={<AdminLogin />} />
                    <Route path="/login/user" element={<UserLogin />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                     <Route path="/reset-password" element={<ResetPassword />} />

                    <Route
                        path="/admin/dashboard"
                        element={<PrivateRoute roles={['admin']}><AdminDashboard /></PrivateRoute>}
                    />
                    <Route
                        path="/admin/manage-users"
                        element={<PrivateRoute roles={['admin']}><AdminUserManagement /></PrivateRoute>}
                    />
                    <Route
                        path="/admin/manage-salaries" 
                        element={<PrivateRoute roles={['admin']}><AdminSalaryManagement /></PrivateRoute>}
                    />
                    <Route path="/admin/manage-offerletters" element={<AdminOfferLetterManagement />} />
                    <Route
                        path="/admin/users/add"
                        element={<PrivateRoute roles={['admin']}><AddUser /></PrivateRoute>}
                    />
                    <Route
                        path="/admin/users/edit/:id"
                        element={<PrivateRoute roles={['admin']}><EditUser /></PrivateRoute>}
                    />
                    <Route
                        path="/admin/salary/add/:userId?" 
                        element={<PrivateRoute roles={['admin']}><AdminSalaryForm /></PrivateRoute>}
                    />

                    {/* User Routes */}
                    <Route
                        path="/user/dashboard"
                        element={<PrivateRoute roles={['user']}><UserDashboard /></PrivateRoute>}
                    />
                    <Route
                        path="/user/change-password"
                        element={<PrivateRoute roles={['user', 'admin']}><ChangePassword /></PrivateRoute>}
                    />

                    <Route path="*" element={<div>404 - Page Not Found</div>} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;