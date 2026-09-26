import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function SignUp({ onSwitchToLogin }) {
  const [step, setStep] = useState('form'); // 'form' | 'otp'
  const [formData, setFormData] = useState({ username: '', email: '', password: '', confirm: '' });
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef([]);
  const timerRef = useRef(null);

  function startResendTimer() {
    setResendTimer(60);
    timerRef.current = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  }

  async function handleSendOtp(e) {
    e.preventDefault();
    setMsg(null);
    const { username, email, password, confirm } = formData;
    if (!username || !email || !password || !confirm)
      return setMsg({ type: 'error', text: 'Please fill in all fields.' });
    if (password !== confirm)
      return setMsg({ type: 'error', text: 'Passwords do not match.' });
    if (password.length < 6)
      return setMsg({ type: 'error', text: 'Password must be at least 6 characters.' });

    setLoading(true);
    try {
      const { data } = await api.post('/auth/send-otp', { email, username, password });
      setMsg({ type: 'success', text: data.message });
      setStep('otp');
      startResendTimer();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Something went wrong.' });
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setMsg(null);
    setLoading(true);
    try {
      await api.post('/auth/send-otp', {
        email: formData.email,
        username: formData.username,
        password: formData.password,
      });
      setMsg({ type: 'success', text: 'OTP resent! Check your inbox.' });
      setOtpDigits(['', '', '', '', '', '']);
      startResendTimer();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to resend.' });
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    const otp = otpDigits.join('');
    if (otp.length < 6) return setMsg({ type: 'error', text: 'Enter all 6 digits.' });
    setLoading(true);
    setMsg(null);
    try {
      const { data } = await api.post('/auth/verify-otp', { email: formData.email, otp });
      setMsg({ type: 'success', text: data.message });
      setTimeout(() => onSwitchToLogin(), 1600);
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Verification failed.' });
    } finally {
      setLoading(false);
    }
  }

  function handleOtpChange(index, value) {
    if (!/^\d?$/.test(value)) return;
    const updated = [...otpDigits];
    updated[index] = value;
    setOtpDigits(updated);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  }

  function handleOtpKeyDown(index, e) {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0)
      otpRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowLeft' && index > 0) otpRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < 5) otpRefs.current[index + 1]?.focus();
  }

  function handleOtpPaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const updated = ['', '', '', '', '', ''];
    for (let i = 0; i < pasted.length; i++) updated[i] = pasted[i];
    setOtpDigits(updated);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  }

  // ── OTP step ──────────────────────────────────────────────────────────────
  if (step === 'otp') return (
    <form onSubmit={handleVerifyOtp} id="otp-verify-form">
      <div className="form-heading" style={{ textAlign: 'center' }}>
        <h2 className="form-title">Check your inbox 📬</h2>
        <p className="form-desc">We sent a 6-digit code to</p>
        <span className="otp-email-pill">✉️ {formData.email}</span>
      </div>

      {msg && (
        <div className={`alert alert-${msg.type}`}>
          <span>{msg.type === 'error' ? '⚠️' : '✅'}</span>
          <span>{msg.text}</span>
        </div>
      )}

      <div className="form-group">
        <div className="otp-label">Enter OTP</div>
        <div className="otp-grid" onPaste={handleOtpPaste}>
          {otpDigits.map((digit, i) => (
            <input
              key={i}
              id={`otp-digit-${i}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              className={`otp-cell${digit ? ' filled' : ''}`}
              value={digit}
              ref={el => (otpRefs.current[i] = el)}
              onChange={e => handleOtpChange(i, e.target.value)}
              onKeyDown={e => handleOtpKeyDown(i, e)}
            />
          ))}
        </div>
      </div>

      <button type="submit" id="verify-otp-btn" className="btn-primary" disabled={loading}>
        {loading && <span className="spinner" />}
        {loading ? 'Verifying…' : '✓ Verify & Create Account'}
      </button>

      <div className="resend-row">
        {resendTimer > 0 ? (
          <span className="countdown">⏱ Resend available in {resendTimer}s</span>
        ) : (
          <button type="button" className="btn-ghost" onClick={handleResend} disabled={loading}>
            Resend OTP
          </button>
        )}
      </div>

      <div className="resend-row" style={{ marginTop: '10px' }}>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => { setStep('form'); setMsg(null); }}
        >
          ← Change email
        </button>
      </div>
    </form>
  );

  // ── Sign Up form ──────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSendOtp} id="signup-form">
      <div className="form-heading">
        <h2 className="form-title">Create account ✨</h2>
        <p className="form-desc">Join Stock Sense and take control of your inventory</p>
      </div>

      {msg && (
        <div className={`alert alert-${msg.type}`}>
          <span>{msg.type === 'error' ? '⚠️' : '✅'}</span>
          <span>{msg.text}</span>
        </div>
      )}

      <div className="form-group">
        <label className="form-label" htmlFor="signup-username">Username</label>
        <div className="input-wrap">
          <input
            id="signup-username"
            type="text"
            className="form-input"
            placeholder="John Doe"
            value={formData.username}
            onChange={e => setFormData(p => ({ ...p, username: e.target.value }))}
            autoComplete="name"
          />
          <span className="input-icon">👤</span>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="signup-email">Email address</label>
        <div className="input-wrap">
          <input
            id="signup-email"
            type="email"
            className="form-input"
            placeholder="you@example.com"
            value={formData.email}
            onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
            autoComplete="email"
          />
          <span className="input-icon">✉️</span>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="signup-password">Password</label>
        <div className="input-wrap">
          <input
            id="signup-password"
            type={showPw ? 'text' : 'password'}
            className="form-input"
            placeholder="Min. 6 characters"
            value={formData.password}
            onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
            autoComplete="new-password"
          />
          <span className="input-icon">🔒</span>
          <button type="button" className="pw-eye" onClick={() => setShowPw(p => !p)}>
            {showPw ? '🙈' : '👁️'}
          </button>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="signup-confirm">Confirm password</label>
        <div className="input-wrap">
          <input
            id="signup-confirm"
            type={showPw ? 'text' : 'password'}
            className="form-input"
            placeholder="Repeat password"
            value={formData.confirm}
            onChange={e => setFormData(p => ({ ...p, confirm: e.target.value }))}
            autoComplete="new-password"
          />
          <span className="input-icon">🔒</span>
        </div>
      </div>

      <button type="submit" id="signup-submit-btn" className="btn-primary" disabled={loading}>
        {loading && <span className="spinner" />}
        {loading ? 'Sending OTP…' : 'Send Verification Code →'}
      </button>

      <div className="auth-footer">
        Already have an account?{' '}
        <button type="button" className="btn-ghost" onClick={onSwitchToLogin}>
          Sign in
        </button>
      </div>
    </form>
  );
}
