import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Wallet, User, Mail, Lock, ArrowRight, RefreshCw, ShieldCheck } from 'lucide-react';

const Register = () => {
    const [step, setStep]         = useState('form'); // 'form' | 'otp'
    const [name, setName]         = useState('');
    const [email, setEmail]       = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp]           = useState(['', '', '', '', '', '']);
    const [otpEmail, setOtpEmail] = useState('');
    const [error, setError]       = useState('');
    const [success, setSuccess]   = useState('');
    const [loading, setLoading]   = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);

    const inputRefs = useRef([]);
    const { register, verifyOtp, resendOtp } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (resendCooldown <= 0) return;
        const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
        return () => clearTimeout(t);
    }, [resendCooldown]);

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const data = await register(name.trim(), email.trim(), password);
            if (data.requiresOTP) {
                setOtpEmail(data.email);
                setStep('otp');
                setResendCooldown(60);
                setTimeout(() => inputRefs.current[0]?.focus(), 100);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleOtpSubmit = async (e) => {
        e.preventDefault();
        const code = otp.join('');
        if (code.length < 6) { setError('Please enter the complete 6-digit OTP.'); return; }
        setError('');
        setLoading(true);
        try {
            await verifyOtp(otpEmail, code, 'register');
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Incorrect OTP. Please try again.');
            setOtp(['', '', '', '', '', '']);
            setTimeout(() => inputRefs.current[0]?.focus(), 50);
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendCooldown > 0) return;
        setError('');
        setSuccess('');
        try {
            await resendOtp(otpEmail, 'register');
            setSuccess('A new OTP has been sent to your email.');
            setOtp(['', '', '', '', '', '']);
            setResendCooldown(60);
            setTimeout(() => inputRefs.current[0]?.focus(), 50);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to resend OTP.');
        }
    };

    const handleOtpChange = (idx, val) => {
        if (!/^\d*$/.test(val)) return;
        const next = [...otp];
        next[idx] = val.slice(-1);
        setOtp(next);
        if (val && idx < 5) inputRefs.current[idx + 1]?.focus();
    };

    const handleOtpKeyDown = (idx, e) => {
        if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
            inputRefs.current[idx - 1]?.focus();
        }
    };

    const handleOtpPaste = (e) => {
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted.length === 6) {
            setOtp(pasted.split(''));
            inputRefs.current[5]?.focus();
        }
        e.preventDefault();
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '1rem', background: 'var(--bg-primary)' }}>
            <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem' }}>

                {/* Logo */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
                    <div style={{ background: 'var(--primary)', padding: '0.75rem', borderRadius: '0.75rem', marginBottom: '1rem', boxShadow: '0 4px 14px 0 rgba(59,130,246,0.4)' }}>
                        {step === 'form' ? <Wallet size={32} color="white" /> : <ShieldCheck size={32} color="white" />}
                    </div>
                    <h1 style={{ fontSize: '1.5rem', textAlign: 'center', margin: 0 }}>
                        {step === 'form' ? 'Create Account' : 'Verify Your Email'}
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.4rem', textAlign: 'center', fontSize: '0.9rem' }}>
                        {step === 'form'
                            ? 'Get started with FinanceTracker'
                            : <>OTP sent to <strong style={{ color: 'var(--primary)' }}>{otpEmail}</strong></>}
                    </p>
                </div>

                {/* Step indicator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    {['form', 'otp'].map((s, i) => (
                        <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < 1 ? '0 0 auto' : 1 }}>
                            <div style={{
                                width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.75rem', fontWeight: 700,
                                background: step === s ? 'var(--primary)' : (i === 0 && step === 'otp') ? 'var(--success)' : 'var(--bg-secondary)',
                                color: (step === s || (i === 0 && step === 'otp')) ? 'white' : 'var(--text-muted)',
                                transition: 'all 0.3s ease'
                            }}>
                                {i === 0 && step === 'otp' ? '✓' : i + 1}
                            </div>
                            {i < 1 && <div style={{ flex: 1, height: '2px', background: step === 'otp' ? 'var(--success)' : 'var(--bg-secondary)', margin: '0 0.5rem', transition: 'all 0.3s ease' }} />}
                        </div>
                    ))}
                </div>

                {/* Error / Success */}
                {error && (
                    <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
                        ⚠️ {error}
                    </div>
                )}
                {success && (
                    <div style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--success)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
                        ✅ {success}
                    </div>
                )}

                {/* ── Step 1: Registration form ── */}
                {step === 'form' && (
                    <form onSubmit={handleRegister}>
                        <div className="input-group">
                            <label className="input-label" htmlFor="name">
                                <User size={14} style={{ display: 'inline', marginRight: '0.3rem' }} />Full Name
                            </label>
                            <input id="name" type="text" className="input-field" placeholder="John Doe"
                                value={name} onChange={e => setName(e.target.value)} required />
                        </div>
                        <div className="input-group">
                            <label className="input-label" htmlFor="email">
                                <Mail size={14} style={{ display: 'inline', marginRight: '0.3rem' }} />Email Address
                            </label>
                            <input id="email" type="email" className="input-field" placeholder="you@example.com"
                                value={email} onChange={e => setEmail(e.target.value)} required />
                        </div>
                        <div className="input-group">
                            <label className="input-label" htmlFor="password">
                                <Lock size={14} style={{ display: 'inline', marginRight: '0.3rem' }} />Password
                            </label>
                            <input id="password" type="password" className="input-field" placeholder="Min. 6 characters"
                                value={password} onChange={e => setPassword(e.target.value)} required minLength="6" />
                        </div>
                        <button type="submit" className="btn btn-primary"
                            style={{ width: '100%', marginTop: '1.25rem', padding: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                            disabled={loading}>
                            {loading ? 'Creating account...' : <><span>Create Account</span><ArrowRight size={16} /></>}
                        </button>
                    </form>
                )}

                {/* ── Step 2: OTP ── */}
                {step === 'otp' && (
                    <form onSubmit={handleOtpSubmit}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem', textAlign: 'center' }}>
                            Enter the 6-digit code from your inbox to activate your account.
                        </p>

                        <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', marginBottom: '1.5rem' }} onPaste={handleOtpPaste}>
                            {otp.map((digit, idx) => (
                                <input
                                    key={idx}
                                    ref={el => inputRefs.current[idx] = el}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={e => handleOtpChange(idx, e.target.value)}
                                    onKeyDown={e => handleOtpKeyDown(idx, e)}
                                    style={{
                                        width: '48px', height: '56px', textAlign: 'center', fontSize: '1.5rem',
                                        fontWeight: 700, fontFamily: 'monospace', borderRadius: '0.5rem',
                                        border: `2px solid ${digit ? 'var(--primary)' : 'var(--border)'}`,
                                        background: 'var(--bg-secondary)', color: 'var(--text-primary)',
                                        outline: 'none', transition: 'border-color 0.2s',
                                        caretColor: 'var(--primary)'
                                    }}
                                />
                            ))}
                        </div>

                        <button type="submit" className="btn btn-primary"
                            style={{ width: '100%', padding: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                            disabled={loading || otp.join('').length < 6}>
                            {loading ? 'Verifying...' : <><ShieldCheck size={16} /><span>Verify & Enter App</span></>}
                        </button>

                        <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            Didn't receive it?{' '}
                            <button type="button" onClick={handleResend}
                                disabled={resendCooldown > 0}
                                style={{ background: 'none', border: 'none', cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer', color: resendCooldown > 0 ? 'var(--text-muted)' : 'var(--primary)', fontWeight: 600, padding: 0, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                <RefreshCw size={13} />
                                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                            </button>
                        </div>
                    </form>
                )}

                <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Already have an account?{' '}
                    <Link to="/login" style={{ fontWeight: 600, color: 'var(--primary)' }}>Sign in</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
