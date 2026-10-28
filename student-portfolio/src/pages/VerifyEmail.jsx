import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { verifyEmail, resendVerification } from '../api';
import { useAuth } from '../context/AuthContext';

function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const { login } = useAuth();
    const navigate = useNavigate();

    const [status, setStatus] = useState('verifying'); // verifying | success | error
    const [message, setMessage] = useState('');
    const [email, setEmail] = useState('');
    const [resendStatus, setResendStatus] = useState('');

    useEffect(() => {
        const token = searchParams.get('token');
        if (!token) {
            setStatus('error');
            setMessage('No verification token found in the URL.');
            return;
        }

        const doVerify = async () => {
            try {
                const data = await verifyEmail(token);
                // Backend returns a JWT on successful verification
                if (data.token) {
                    localStorage.setItem('token', data.token);
                    // Reload user into auth context via login flow
                }
                setStatus('success');
                setMessage(data.message || 'Email verified successfully!');
                // Redirect after short delay
                setTimeout(() => navigate('/tasks'), 2000);
            } catch (err) {
                setStatus('error');
                setMessage(err.message || 'Verification failed. The link may have expired.');
            }
        };

        doVerify();
    }, []);

    const handleResend = async () => {
        if (!email) {
            setResendStatus('Please enter your email address above.');
            return;
        }
        try {
            setResendStatus('Sending…');
            await resendVerification(email);
            setResendStatus('Verification email sent! Check your inbox.');
        } catch (err) {
            setResendStatus(err.message || 'Failed to resend');
        }
    };

    return (
        <section className="auth-page">
            <div className="auth-card">
                {status === 'verifying' && (
                    <>
                        <div className="page-loader-spinner" style={{ margin: '0 auto 16px' }} aria-hidden="true" />
                        <p className="section-label">Verifying</p>
                        <h2>Confirming your email…</h2>
                    </>
                )}

                {status === 'success' && (
                    <div className="auth-success">
                        <p className="section-label">Verified</p>
                        <h2>Email confirmed!</h2>
                        <p>{message}</p>
                        <p className="auth-subtitle">Redirecting you to the Task Manager…</p>
                    </div>
                )}

                {status === 'error' && (
                    <>
                        <p className="section-label">Error</p>
                        <h2>Verification failed</h2>
                        <div className="auth-error"><p>{message}</p></div>

                        <div className="verify-prompt">
                            <p>Enter your email to request a new verification link:</p>
                            <input
                                type="email"
                                className="auth-standalone-input"
                                placeholder="you@example.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                            <button className="auth-btn" onClick={handleResend}>
                                Resend Verification Email
                            </button>
                            {resendStatus && <p className="resend-status">{resendStatus}</p>}
                        </div>

                        <p className="auth-switch">
                            <Link to="/login" className="auth-link">Back to login</Link>
                        </p>
                    </>
                )}
            </div>
        </section>
    );
}

export default VerifyEmail;
