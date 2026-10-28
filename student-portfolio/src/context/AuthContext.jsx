import { createContext, useContext, useEffect, useState } from 'react';
import { getCurrentUser, loginUser, registerUser, googleLogin as apiGoogleLogin } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');

        if (!token) {
            setLoading(false);
            return;
        }

        const loadUser = async () => {
            try {
                const data = await getCurrentUser();
                setUser(data.data);
            } catch {
                localStorage.removeItem('token');
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        loadUser();
    }, []);

    const login = async (email, password) => {
        const data = await loginUser({ email, password });
        localStorage.setItem('token', data.token);
        setUser(data.data);
        return data;
    };

    const register = async (name, email, password, work) => {
        // Registration no longer auto-logs in — requires email verification first
        const data = await registerUser({ name, email, password, work });
        return data;
    };

    const googleLogin = async (credential, work = '') => {
        const data = await apiGoogleLogin(credential, work);
        if (data.token) {
            localStorage.setItem('token', data.token);
            setUser(data.data);
        }
        return data;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    const value = {
        user,
        loading,
        login,
        register,
        googleLogin,
        logout,
        isAuthenticated: Boolean(user),
        isAdmin: user?.role === 'admin'
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used inside AuthProvider');
    return context;
}
