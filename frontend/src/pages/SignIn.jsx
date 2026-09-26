import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function SignIn({ onSwitchToSignUp }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg(null);
    if (!form.email || !form.password)
      return setMsg({ type: 'error', text: 'Please fill in all fields.' });

    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.token, { username: data.username, email: data.email });
      navigate('/dashboard');
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Login failed. Try again.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} id="signin-form">
      <div className="form-heading">
        <h2 className="form-title">Welcome back 👋</h2>
        <p className="form-desc">Sign in to continue to your dashboard</p>
      </div>

      {msg && (
        <div className={`alert alert-${msg.type}`}>
          <span>{msg.type === 'error' ? '⚠️' : '✅'}</span>
          <span>{msg.text}</span>
        </div>
      )}

      <div className="form-group">
        <label className="form-label" htmlFor="login-email">Email address</label>
        <div className="input-wrap">
          <input
            id="login-email"
            type="email"
            className="form-input"
            placeholder="you@example.com"
            value={form.email}
            onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            autoComplete="email"
            autoFocus
          />
          <span className="input-icon">✉️</span>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="login-password">Password</label>
        <div className="input-wrap">
          <input
            id="login-password"
            type={showPw ? 'text' : 'password'}
            className="form-input"
            placeholder="Enter your password"
            value={form.password}
            onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
            autoComplete="current-password"
          />
          <span className="input-icon">🔒</span>
          <button type="button" className="pw-eye" onClick={() => setShowPw(p => !p)}>
            {showPw ? '🙈' : '👁️'}
          </button>
        </div>
      </div>

      <button type="submit" id="signin-submit-btn" className="btn-primary" disabled={loading}>
        {loading && <span className="spinner" />}
        {loading ? 'Signing in…' : 'Sign In →'}
      </button>

      <div className="auth-footer">
        No account yet?{' '}
        <button type="button" className="btn-ghost" onClick={onSwitchToSignUp}>
          Create one free
        </button>
      </div>
    </form>
  );
}
