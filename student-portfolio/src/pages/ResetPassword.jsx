import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { resetPassword } from '../api';

function ResetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [form, setForm] = useState({ password: '', confirmPassword: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (form.password !== form.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (form.password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        if (!token) {
            setError('Invalid or missing reset token');
            return;
        }

        try {
            setLoading(true);
            const data = await resetPassword(token, form.password);
            setSuccess(data.message || 'Password reset successfully!');
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError(err.message || 'Reset failed');
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <section className="auth-page">
                <div className="auth-card">
                    <div className="auth-error">
                        <p>Invalid reset link. Please request a new one.</p>
                    </div>
                    <Link to="/forgot-password" className="auth-btn" style={{ display: 'inline-block', textDecoration: 'none', textAlign: 'center', marginTop: '16px' }}>
                        Request Reset Link
                    </Link>
                </div>
            </section>
        );
    }

    return (
        <section className="auth-page">
            <div className="auth-card">
                <p className="section-label">Account</p>
                <h1>Reset Password</h1>

                {error && <div className="auth-error"><p>{error}</p></div>}
                {success && <div className="auth-success-msg"><p>{success}</p><p className="auth-subtitle">Redirecting to login…</p></div>}

                {!success && (
                    <form className="auth-form" onSubmit={handleSubmit}>
                        <label>
                            New Password
                            <input
                                type="password"
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                placeholder="Minimum 8 characters"
                                required
                                minLength={8}
                                autoComplete="new-password"
                            />
                        </label>

                        <label>
                            Confirm New Password
                            <input
                                type="password"
                                name="confirmPassword"
                                value={form.confirmPassword}
                                onChange={handleChange}
                                placeholder="Repeat new password"
                                required
                                autoComplete="new-password"
                            />
                        </label>

                        <button type="submit" className="auth-btn" disabled={loading}>
                            {loading ? 'Resetting…' : 'Reset Password'}
                        </button>
                    </form>
                )}

                <p className="auth-switch">
                    <Link to="/login" className="auth-link">← Back to login</Link>
                </p>
            </div>
        </section>
    );
}

export default ResetPassword;
