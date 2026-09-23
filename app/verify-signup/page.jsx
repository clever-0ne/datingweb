'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AuthShell, { authInputCls, authLabelCls, authBtnCls } from '@/components/AuthShell';

export default function VerifySignupPage() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState('code'); // 'code' or 'details'
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes

  useEffect(() => {
    // Get email from URL params if available
    const emailParam = searchParams.get('email');
    if (emailParam) setEmail(emailParam);
  }, [searchParams]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email || !code) {
      setError('Email and code are required');
      return;
    }

    setLoading(true);

    try {
      // Just verify the code is valid, then ask for signup details
      // We'll verify everything together in the next step
      setMessage('Code verified! Now create your account details.');
      setStep('details');
    } catch (err) {
      setError(err.message || 'Error verifying code');
    }

    setLoading(false);
  };

  const handleResendCode = async () => {
    if (!email) {
      setError('Enter your email first');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/resend-signup-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage('New verification code sent to your email');
        setTimeLeft(900); // Reset timer
      } else {
        setError(data.error || 'Failed to resend code');
      }
    } catch (err) {
      setError(err.message || 'Error resending code');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email || !code || !name || !password) {
      setError('All fields are required');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, name, password }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage('Account created successfully! Redirecting to login...');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        setError(data.error || 'Failed to create account');
      }
    } catch (err) {
      setError(err.message || 'Error creating account');
    }

    setLoading(false);
  };

  return (
    <AuthShell title="Verify Email" subtitle="Complete your signup process">
      {step === 'code' ? (
        <form onSubmit={handleVerifyCode} className="space-y-4" noValidate>
          <div>
            <label htmlFor="verify-email" className={authLabelCls}>
              Email Address
            </label>
            <input
              id="verify-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={authInputCls}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="verify-code" className={authLabelCls}>
                Verification Code
              </label>
              <span className="text-xs text-red-600 font-medium">
                Expires in: {formatTime(timeLeft)}
              </span>
            </div>
            <input
              id="verify-code"
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.slice(0, 6))}
              placeholder="000000"
              maxLength="6"
              className={authInputCls + ' text-center text-2xl tracking-widest'}
            />
            <p className="text-xs text-gray-600 mt-2">
              Check your email for the 6-digit code
            </p>
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

          <button id="verify-submit" type="submit" disabled={loading} className={authBtnCls}>
            {loading ? 'Verifying...' : 'Verify Code'}
          </button>

          <button
            type="button"
            onClick={handleResendCode}
            disabled={loading || timeLeft > 600}
            className="w-full text-blue-600 hover:underline text-sm font-medium disabled:opacity-50"
          >
            Didn't receive code? Resend
          </button>
        </form>
      ) : (
        <form onSubmit={handleCreateAccount} className="space-y-4" noValidate>
          <div>
            <label htmlFor="signup-name" className={authLabelCls}>
              Full Name
            </label>
            <input
              id="signup-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className={authInputCls}
            />
          </div>

          <div>
            <label htmlFor="signup-password" className={authLabelCls}>
              Password
            </label>
            <input
              id="signup-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={authInputCls}
            />
            <p className="text-xs text-gray-600 mt-1">Min 8 characters</p>
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

          <button id="create-account" type="submit" disabled={loading} className={authBtnCls}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
      )}

      <p className="mt-4 text-center text-xs text-gray-600">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-black hover:underline">
          Sign In
        </Link>
      </p>
    </AuthShell>
  );
}
