import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; 

const Header = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login/user'); 
    };

    return (
        <header className="app-header">
            <div className="header-left-section">
                <Link className="header-logo-link"> 
                    <img src="/images/company_logo.jpg" alt="Company Logo" className="header-logo-img" />
                </Link>
                <h1>       VIKARTR TECHNOLOGIES LLP   </h1>
            </div>

            <nav className="header-links">
                {user ? ( 
                    <>
                        {user.role === 'admin' && (
                            <Link to="/admin/dashboard">Admin Dashboard</Link>
                        )}
                        {user.role === 'user' && (
                            <Link to="/user/dashboard">My Salary Slips</Link>
                        )}
                        <Link to="/user/change-password">Change Password</Link> 
                        <button onClick={handleLogout} className="logout-btn">Logout</button>
                    </>
                ) : ( 
                    <>
                        <Link to="/login/user">User Login</Link>
                        <Link to="/login/admin">Admin Login</Link>
                    </>
                )}
            </nav>
        </header>
    );
};

export default Header;