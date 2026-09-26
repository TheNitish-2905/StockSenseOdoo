import React, { useState } from 'react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useAuth } from '../store/AuthContext';
import { useToast } from '../store/ToastContext';

export default function Login({ navigate }) {
  const { login } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('admin@stocksense.local');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      login(email, password);
      showToast('Welcome back to StockSense.', 'success');
      navigate('dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = () => {
    setEmail('admin@stocksense.local');
    setPassword('admin123');
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-left">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-slate-900 text-white font-bold text-xl shadow-xs mb-3">
          S
        </div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          Sign in to StockSense
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Enterprise inventory control & warehouse management
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-slate-200 sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@stocksense.local"
            />

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-700">
                  Password <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => navigate('forgot-password')}
                  className="text-xs font-medium text-sky-600 hover:text-sky-800"
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 bg-white"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              loading={loading}
            >
              Sign In
            </Button>
          </form>

          {/* Demo User Fast Credentials Tip */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="bg-slate-50 p-3 rounded-md border border-slate-200 flex items-center justify-between">
              <div className="text-[11px] text-slate-600">
                <span className="font-semibold text-slate-800 block">Demo Credentials:</span>
                <code>admin@stocksense.local</code> / <code>admin123</code>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleQuickDemo}
                className="text-xs"
              >
                Autofill
              </Button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-500">
            Don't have an account yet?{' '}
            <button
              onClick={() => navigate('signup')}
              className="font-medium text-slate-900 hover:underline"
            >
              Sign up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
