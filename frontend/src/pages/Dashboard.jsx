import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : '??';

  return (
    <div className="dashboard-wrapper">
      {/* Animated background (reuse same orbs) */}
      <div className="bg-canvas" style={{ position: 'fixed' }}>
        <div className="bg-grid" />
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      {/* Top bar */}
      <header className="topbar">
        <div className="topbar-brand">
          <div className="topbar-brand-icon">📦</div>
          Stock Sense
        </div>

        <div className="topbar-right">
          <div className="user-badge">
            <div className="user-avatar">{initials}</div>
            <span className="user-name">{user?.username || 'User'}</span>
          </div>
          <button id="logout-btn" className="logout-btn" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </header>

      {/* Body */}
      <main className="dashboard-body" style={{ position: 'relative', zIndex: 1 }}>
        <div className="coming-soon-card">
          <span className="coming-soon-icon">🚀</span>
          <h1 className="coming-soon-title">Dashboard</h1>
          <p className="coming-soon-sub">
            Welcome back,{' '}
            <strong style={{ color: '#a5b4fc' }}>{user?.username}</strong>!
            <br />
            Your inventory management dashboard is being built.
          </p>
        </div>
      </main>
    </div>
  );
}
