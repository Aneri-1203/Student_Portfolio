import { lazy, Suspense, useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import NavBar from './components/NavBar';
import Footer from './components/Footer';
import PageLoader from './components/PageLoader';
import { useAuth } from './context/AuthContext';

// Eager — always needed
import Home from './pages/Home';

// Lazy — loaded on demand
const Projects     = lazy(() => import('./pages/Projects'));
const Contact      = lazy(() => import('./pages/Contact'));
const Tasks        = lazy(() => import('./pages/Tasks'));
const NotFound     = lazy(() => import('./pages/NotFound'));
const Login        = lazy(() => import('./pages/Login'));
const Register     = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword  = lazy(() => import('./pages/ResetPassword'));
const VerifyEmail    = lazy(() => import('./pages/VerifyEmail'));
const Admin          = lazy(() => import('./pages/Admin'));

import './App.css';

/* Protected route — redirects to /login if not authenticated */
function PrivateRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();
    if (loading) return <PageLoader />;
    return isAuthenticated ? children : <Navigate to="/login" replace />;
}

/* Admin-only route */
function AdminRoute({ children }) {
    const { isAuthenticated, isAdmin, loading } = useAuth();
    if (loading) return <PageLoader />;
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (!isAdmin) return <Navigate to="/tasks" replace />;
    return children;
}

/* Redirect authenticated users away from login/register */
function GuestRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();
    if (loading) return <PageLoader />;
    return !isAuthenticated ? children : <Navigate to="/tasks" replace />;
}

function App() {
    const [theme, setTheme] = useState('dark');

    useEffect(() => {
        document.documentElement.className = theme;
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    return (
        <div className="app">
            <NavBar theme={theme} onToggleTheme={toggleTheme} />

            <Suspense fallback={<PageLoader />}>
                <Routes>
                    {/* Public portfolio pages */}
                    <Route path="/" element={<Home />} />
                    <Route path="/projects" element={<Projects />} />
                    <Route path="/contact" element={<Contact />} />

                    {/* Task manager — public to view, auth required to mutate */}
                    <Route path="/tasks" element={<Tasks />} />

                    {/* Auth pages — redirect if already logged in */}
                    <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
                    <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/verify-email" element={<VerifyEmail />} />

                    {/* Admin dashboard */}
                    <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />

                    <Route path="*" element={<NotFound />} />
                </Routes>
            </Suspense>

            <Footer />
        </div>
    );
}

export default App;
