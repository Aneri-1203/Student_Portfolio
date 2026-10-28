import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Register() {
    const { register } = useAuth();

    const [form, setForm] = useState({
        name: '', email: '', password: '', confirmPassword: '', work: ''
    });
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

        try {
            setLoading(true);
            const data = await register(form.name, form.email, form.password, form.work);
            setSuccess(data.message || 'Account created! Check your email to verify your account.');
        } catch (err) {
            setError(err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <section className="auth-page">
                <div className="auth-card">
                    <div className="auth-success">
                        <p className="section-label">Almost there</p>
                        <h2>Check your email</h2>
                        <p>{success}</p>
                        <p className="auth-subtitle">
                            Click the link in the email to verify your account and start using the Task Manager.
                        </p>
                        <Link to="/login" className="auth-btn" style={{ display: 'inline-block', textDecoration: 'none', textAlign: 'center' }}>
                            Go to Login
                        </Link>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="auth-page">
            <div className="auth-card">
                <p className="section-label">Account</p>
                <h1>Create Account</h1>
                <p className="auth-subtitle">Join to submit and track tasks</p>

                {error && <div className="auth-error"><p>{error}</p></div>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <label>
                        Full Name
                        <input
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="Your name"
                            required
                            minLength={2}
                        />
                    </label>

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
                            placeholder="Minimum 8 characters"
                            required
                            minLength={8}
                            autoComplete="new-password"
                        />
                    </label>

                    <label>
                        Confirm Password
                        <input
                            type="password"
                            name="confirmPassword"
                            value={form.confirmPassword}
                            onChange={handleChange}
                            placeholder="Repeat password"
                            required
                            autoComplete="new-password"
                        />
                    </label>

                    <label>
                        Your role / relationship
                        <input
                            type="text"
                            name="work"
                            value={form.work}
                            onChange={handleChange}
                            placeholder="e.g. Classmate, Recruiter, Collaborator"
                            required
                        />
                    </label>

                    <button type="submit" className="auth-btn" disabled={loading}>
                        {loading ? 'Creating account…' : 'Create Account'}
                    </button>
                </form>

                <p className="auth-switch">
                    Already have an account?{' '}
                    <Link to="/login" className="auth-link">Sign in</Link>
                </p>
            </div>
        </section>
    );
}

export default Register;
