import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../api';

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        try {
            setLoading(true);
            const data = await forgotPassword(email);
            setMessage(data.message || 'Check your email for a reset link.');
        } catch (err) {
            setError(err.message || 'Request failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="auth-page">
            <div className="auth-card">
                <p className="section-label">Account</p>
                <h1>Forgot Password</h1>
                <p className="auth-subtitle">Enter your email and we&apos;ll send a reset link</p>

                {error && <div className="auth-error"><p>{error}</p></div>}
                {message && <div className="auth-success-msg"><p>{message}</p></div>}

                {!message && (
                    <form className="auth-form" onSubmit={handleSubmit}>
                        <label>
                            Email
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                            />
                        </label>
                        <button type="submit" className="auth-btn" disabled={loading}>
                            {loading ? 'Sending…' : 'Send Reset Link'}
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

export default ForgotPassword;
