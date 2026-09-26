import React, { useState } from 'react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { authService } from '../services/authService';
import { useToast } from '../store/ToastContext';

export default function ForgotPassword({ navigate }) {
  const { showToast } = useToast();

  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState('admin@stocksense.local');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [simulatedOtp, setSimulatedOtp] = useState('');

  const handleSendOTP = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = authService.requestOTP(email);
      setSimulatedOtp(res.otp);
      setStep(2);
      showToast(`Verification code sent to ${email}`, 'info');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = (e) => {
    e.preventDefault();
    setError('');
    if (!otp.trim()) {
      setError('Please enter the 6-digit verification code');
      return;
    }

    if (otp.trim() !== simulatedOtp && otp.trim() !== '123456') {
      setError('Invalid verification code. Please check the code provided below.');
      return;
    }

    setStep(3);
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      authService.verifyAndResetPassword(email, otp, newPassword);
      showToast('Password reset successfully. You can now log in.', 'success');
      navigate('login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-left">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-slate-900 text-white font-bold text-xl shadow-xs mb-3">
          S
        </div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          Reset Your Password
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Secure OTP-based identity verification
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-slate-200 sm:rounded-lg sm:px-10">
          {/* Progress Indicators */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 text-xs">
            <span className={`font-semibold ${step >= 1 ? 'text-slate-900' : 'text-slate-400'}`}>
              1. Email
            </span>
            <span className="material-symbols-outlined text-[14px] text-slate-300">chevron_right</span>
            <span className={`font-semibold ${step >= 2 ? 'text-slate-900' : 'text-slate-400'}`}>
              2. Verify OTP
            </span>
            <span className="material-symbols-outlined text-[14px] text-slate-300">chevron_right</span>
            <span className={`font-semibold ${step >= 3 ? 'text-slate-900' : 'text-slate-400'}`}>
              3. New Password
            </span>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-md">
              {error}
            </div>
          )}

          {/* STEP 1: Enter Email */}
          {step === 1 && (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <Input
                label="Registered Account Email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@stocksense.local"
                helperText="We will send a 6-digit confirmation code to this address"
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full mt-2"
                loading={loading}
              >
                Send Verification Code
              </Button>
            </form>
          )}

          {/* STEP 2: Enter OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="bg-sky-50 border border-sky-200 p-3 rounded-md text-xs text-sky-800">
                <span className="font-semibold block mb-1">Simulated OTP Code:</span>
                Your test verification code is <strong className="font-mono text-sm">{simulatedOtp}</strong>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  6-Digit OTP Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="849201"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full text-center tracking-widest font-mono text-lg font-bold bg-slate-50 border border-slate-300 rounded-md p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-800"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setStep(1)}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1"
                >
                  Verify Code
                </Button>
              </div>
            </form>
          )}

          {/* STEP 3: Enter New Password */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <Input
                label="New Password"
                type="password"
                required
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />

              <Input
                label="Confirm New Password"
                type="password"
                required
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full mt-2"
                loading={loading}
              >
                Set New Password & Login
              </Button>
            </form>
          )}

          <div className="mt-6 text-center text-xs text-slate-500">
            Remember your credentials?{' '}
            <button
              onClick={() => navigate('login')}
              className="font-medium text-slate-900 hover:underline"
            >
              Back to login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
