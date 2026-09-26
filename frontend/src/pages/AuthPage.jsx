import { useState, useEffect } from 'react';
import SignIn from './SignIn';
import SignUp from './SignUp';

// Animated background component
function Background() {
  return (
    <div className="bg-canvas">
      <div className="bg-grid" />
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="particle" style={{ bottom: `-${20 + Math.random() * 20}px` }} />
      ))}
    </div>
  );
}

const features = [
  { icon: '📦', text: 'Real-time stock tracking & inventory management' },
  { icon: '📊', text: 'Analytics dashboard with smart insights' },
  { icon: '🔔', text: 'Low-stock alerts & automated reorder points' },
  { icon: '🔒', text: 'Enterprise-grade security & role-based access' },
];

const stats = [
  { number: '10K+', label: 'Products' },
  { number: '99.9%', label: 'Uptime' },
  { number: '500+', label: 'Businesses' },
];

// Hook to count up numbers
function useCountUp(target, duration = 1400) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const num = parseFloat(target.replace(/[^0-9.]/g, ''));
    if (!num) return;
    const step = num / (duration / 16);
    let current = 0;
    const t = setInterval(() => {
      current = Math.min(current + step, num);
      setCount(current);
      if (current >= num) clearInterval(t);
    }, 16);
    return () => clearInterval(t);
  }, [target, duration]);

  return target.includes('K')
    ? `${Math.round(count)}K+`
    : target.includes('%')
    ? `${count.toFixed(1)}%`
    : `${Math.round(count)}+`;
}

function StatCard({ number, label, delay }) {
  const animated = useCountUp(number);
  return (
    <div className="stat-card" style={{ animationDelay: `${delay}s` }}>
      <div className="stat-number">{animated}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export default function AuthPage() {
  // 'signin' | 'signup'
  const [activeTab, setActiveTab] = useState('signin');
  // Track direction for slide animation
  const [direction, setDirection] = useState('right'); // 'left'|'right'
  const [animKey, setAnimKey] = useState(0);

  function switchTab(tab) {
    if (tab === activeTab) return;
    setDirection(tab === 'signup' ? 'right' : 'left');
    setAnimKey(k => k + 1);
    setActiveTab(tab);
  }

  return (
    <>
      <Background />
      <div className="auth-layout">
        {/* ── LEFT: Brand & Description ── */}
        <aside className="left-panel">
          {/* Logo */}
          <div className="brand-logo">
            <div className="brand-logo-icon">📦</div>
            <span className="brand-logo-name">Stock Sense</span>
          </div>

          {/* Hero text */}
          <h1 className="hero-heading">
            Smarter Inventory,<br />
            <span className="grad-text">Bigger Growth.</span>
          </h1>
          <p className="hero-sub">
            Stock Sense is your all-in-one inventory management platform — built for modern businesses that demand speed, clarity, and control.
          </p>

          {/* Features */}
          <ul className="feature-list">
            {features.map((f, i) => (
              <li
                key={i}
                className="feature-item"
                style={{ animation: `fadeSlideLeft 0.5s ${0.3 + i * 0.08}s cubic-bezier(0.16,1,0.3,1) both` }}
              >
                <span className="feature-dot">{f.icon}</span>
                {f.text}
              </li>
            ))}
          </ul>

          {/* Stats */}
          <div className="stats-row">
            {stats.map((s, i) => (
              <StatCard key={i} number={s.number} label={s.label} delay={0.5 + i * 0.1} />
            ))}
          </div>
        </aside>

        {/* ── RIGHT: Auth Card ── */}
        <section className="right-panel">
          <div className="glass-card">
            {/* Tab switcher */}
            <div className="tab-switcher">
              <div className={`tab-slider ${activeTab === 'signup' ? 'right' : 'left'}`} />
              <button
                id="tab-signin"
                className={`tab-btn ${activeTab === 'signin' ? 'active' : 'inactive'}`}
                onClick={() => switchTab('signin')}
              >
                Sign In
              </button>
              <button
                id="tab-signup"
                className={`tab-btn ${activeTab === 'signup' ? 'active' : 'inactive'}`}
                onClick={() => switchTab('signup')}
              >
                Sign Up
              </button>
            </div>

            {/* Animated form panel */}
            <div className="form-panels">
              <div
                key={animKey}
                className={`form-panel ${direction === 'right' ? 'entering-right' : 'entering-left'}`}
              >
                {activeTab === 'signin'
                  ? <SignIn onSwitchToSignUp={() => switchTab('signup')} />
                  : <SignUp onSwitchToLogin={() => switchTab('signin')} />
                }
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
