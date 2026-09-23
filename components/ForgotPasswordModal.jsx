'use client';

import { useState } from 'react';

export default function ForgotPasswordModal({ onClose }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('email'); // 'email' or 'reset'
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage('Check your email for a password reset link.');
        setStep('reset');
        setEmail('');
      } else {
        setError(data.error || 'Failed to send reset email.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }

    setLoading(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: resetToken,
          password: newPassword,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage('Password reset successful! Redirecting to login...');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        setError(data.error || 'Failed to reset password.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            {step === 'email' ? 'Reset Password' : 'Enter New Password'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {step === 'email' ? (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              Enter your email address and we'll send you a link to reset your password.
            </p>

            <div>
              <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="reset-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-700">
                {error}
              </div>
            )}

            {message && (
              <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-xs text-green-700">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              Paste the reset token from your email and enter a new password.
            </p>

            <div>
              <label htmlFor="reset-token" className="block text-sm font-medium text-gray-700 mb-1">
                Reset Token
              </label>
              <input
                id="reset-token"
                type="text"
                required
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                placeholder="Paste token from email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                id="new-password"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-700">
                {error}
              </div>
            )}

            {message && (
              <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-xs text-green-700">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        <button
          onClick={onClose}
          className="w-full mt-3 px-4 py-2 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50"
        >
          Close
        </button>
      </div>
    </div>
  );
}
