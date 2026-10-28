import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { resendVerification } from '../api';

function Login() {
    const { login, googleLogin } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [needsVerification, setNeedsVerification] = useState(false);
    const [resendStatus, setResendStatus] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setNeedsVerification(false);

        try {
            setLoading(true);
            const data = await login(form.email, form.password);
            navigate(data.data?.role === 'admin' ? '/admin' : '/tasks');
        } catch (err) {
            if (err.message?.includes('verify your email') || err.message?.includes('requiresVerification')) {
                setNeedsVerification(true);
            }
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        try {
            setResendStatus('Sending...');
            await resendVerification(form.email);
            setResendStatus('Verification email sent! Check your inbox.');
        } catch (err) {
            setResendStatus(err.message || 'Failed to resend');
        }
    };

    return (
        <section className="auth-page">
            <div className="auth-card">
                <p className="section-label">Account</p>
                <h1>Sign In</h1>
                <p className="auth-subtitle">Welcome back to the Portfolio Task Manager</p>

                {error && (
                    <div className="auth-error">
                        <p>{error}</p>
                        {needsVerification && (
                            <div className="verify-prompt">
                                <p>Check your inbox for a verification email.</p>
                                <button
                                    className="link-btn"
                                    onClick={handleResend}
                                    disabled={resendStatus === 'Sending...'}
                                >
                                    Resend verification email
                                </button>
                                {resendStatus && <p className="resend-status">{resendStatus}</p>}
                            </div>
                        )}
                    </div>
                )}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <label>
                        Email
                        <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="you@example.com"
                            required
                            autoComplete="email"
                        />
                    </label>

                    <label>
                        Password
                        <input
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            required
                            autoComplete="current-password"
                        />
                    </label>

                    <div className="auth-links-row">
                        <Link to="/forgot-password" className="auth-link">
                            Forgot password?
                        </Link>
                    </div>

                    <button type="submit" className="auth-btn" disabled={loading}>
                        {loading ? 'Signing in…' : 'Sign In'}
                    </button>
                </form>

                <p className="auth-switch">
                    Don&apos;t have an account?{' '}
                    <Link to="/register" className="auth-link">Create one</Link>
                </p>
            </div>
        </section>
    );
}

export default Login;
