'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AuthShell, { authInputCls, authLabelCls, authBtnCls } from '@/components/AuthShell';
import JunkMailHint from '@/components/JunkMailHint';

/**
 * Step 2 of sign-up. /register stored the form as a pending sign-up (cookie)
 * and emailed a code; entering it here creates the account and signs in.
 */
export default function VerifySignupPage() {
  const [email, setEmail] = useState(null); // null = loading, '' = nothing pending
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [restart, setRestart] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(60);

  useEffect(() => {
    fetch('/api/auth/verify-signup', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setEmail(d.pending ? d.email : ''))
      .catch(() => setEmail(''));
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (code.length !== 6) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.ok) {
        window.location.href = '/dashboard';
        return;
      }
      setError(data.error || 'Could not verify the code.');
      if (data.restart) setRestart(true);
    } catch {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

  const resend = async () => {
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/resend-signup-code', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (data.ok) {
        setMessage('A new code has been sent to your email.');
        setCode('');
        setCooldown(60);
      } else {
        setError(data.error || 'Could not resend the code.');
        if (data.restart) setRestart(true);
      }
    } catch {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

  if (email === '' || restart) {
    return (
      <AuthShell title="Verify Email" subtitle="Your sign-up has expired or was not started.">
        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-700">{error}</div>
        )}
        <Link href="/register" className={authBtnCls + ' flex items-center justify-center'}>
          Register again
        </Link>
        <p className="mt-4 text-center text-xs text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-black hover:underline">Sign In</Link>
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Verify Email"
      subtitle={email ? `We sent a 6-digit code to ${email}.` : 'Checking your sign-up…'}
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="verify-code" className={authLabelCls}>
            Verification Code
          </label>
          <input
            id="verify-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            maxLength={6}
            className={authInputCls + ' text-center text-2xl tracking-widest'}
          />
          <p className="mt-1 text-xs text-gray-600">The code is valid for 15 minutes.</p>
        </div>

        <JunkMailHint />

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-700">{error}</div>
        )}
        {message && (
          <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-xs text-green-700">{message}</div>
        )}

        <button id="verify-submit" type="submit" disabled={loading || !email} className={authBtnCls}>
          {loading ? 'Verifying…' : 'Verify & Create Account'}
        </button>

        <button
          type="button"
          onClick={resend}
          disabled={loading || cooldown > 0 || !email}
          className="w-full text-sm font-medium text-blue-600 hover:underline disabled:opacity-50"
        >
          {cooldown > 0 ? `Resend code in ${cooldown}s` : "Didn't receive the code? Resend"}
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-gray-600">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-black hover:underline">Sign In</Link>
      </p>
    </AuthShell>
  );
}
