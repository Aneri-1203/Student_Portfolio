import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PUBLIC_ROUTES = [
    { to: '/', label: 'Home' },
    { to: '/projects', label: 'Projects' },
    { to: '/contact', label: 'Contact' },
    { to: '/tasks', label: 'Tasks' }
];

function NavBar({ theme, onToggleTheme }) {
    const { user, isAuthenticated, isAdmin, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <nav className="navbar">
            <div className="nav-links">
                {PUBLIC_ROUTES.map(({ to, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={to === '/'}
                        className={({ isActive }) => isActive ? 'active' : ''}
                    >
                        {label}
                    </NavLink>
                ))}

                {isAdmin && (
                    <NavLink
                        to="/admin"
                        className={({ isActive }) => isActive ? 'active' : ''}
                    >
                        Admin
                    </NavLink>
                )}
            </div>

            <div className="nav-auth">
                {isAuthenticated ? (
                    <>
                        <span className="nav-user-name" title={user?.email}>
                            {user?.name?.split(' ')[0]}
                        </span>
                        <button className="nav-logout-btn" onClick={handleLogout}>
                            Logout
                        </button>
                    </>
                ) : (
                    <NavLink
                        to="/login"
                        className={({ isActive }) =>
                            `nav-login-btn ${isActive ? 'active' : ''}`
                        }
                    >
                        Sign In
                    </NavLink>
                )}

                <button className="theme-toggle" onClick={onToggleTheme}>
                    {theme === 'dark' ? '☀ Light' : '☾ Dark'}
                </button>
            </div>
        </nav>
    );
}

export default NavBar;
