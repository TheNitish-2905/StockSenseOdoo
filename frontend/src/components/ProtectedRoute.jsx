import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Shows a loading state while checking JWT, then redirects
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{
          width: '48px', height: '48px',
          borderRadius: '14px',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '24px',
          animation: 'pulse-glow 1.5s ease-in-out infinite'
        }}>📦</div>
        <div className="spinner" style={{ width: '24px', height: '24px' }} />
      </div>
    );
  }

  return user ? children : <Navigate to="/" replace />;
}
