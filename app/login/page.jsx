'use client';

import '@/app/auth.css';
import { useState } from 'react';
import Link from 'next/link';
import AuthShell, { authInputCls, authLabelCls, authBtnCls } from '@/components/AuthShell';
import { PasskeySignIn } from '@/components/PasskeyPanel';
import ForgotPasswordModal from '@/components/ForgotPasswordModal';
import JunkMailHint from '@/components/JunkMailHint';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  // 'password' → 'code' once the password is accepted and a code was emailed.
  const [step, setStep] = useState('password');
  const [code, setCode] = useState('');
  const [info, setInfo] = useState('');

  const requestCode = async () => {
    const r = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password }),
    });
    return r.json();
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setInfo('');
    setBusy(true);
    try {
      const d = await requestCode();
      if (d.ok && d.twoFactor) {
        setCode('');
        setStep('code');
      } else {
        setErr(d.error || 'Unable to sign in.');
      }
    } catch (e) {
      setErr('Network error. Please try again.');
    }
    setBusy(false);
  };

  const submitCode = async (e) => {
    e.preventDefault();
    setErr('');
    setInfo('');
    setBusy(true);
    try {
      const r = await fetch('/api/auth/login/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const d = await r.json();
      if (d.ok) {
        window.location.href = '/dashboard';
        return;
      }
      if (d.expired) {
        setStep('password');
        setPassword('');
      }
      setErr(d.error || 'Unable to verify code.');
    } catch (e) {
      setErr('Network error. Please try again.');
    }
    setBusy(false);
  };

  const resend = async () => {
    setErr('');
    setInfo('');
    setBusy(true);
    try {
      const d = await requestCode();
      if (d.ok && d.twoFactor) {
        setCode('');
        setInfo('A new code has been sent to your email.');
      } else {
        setErr(d.error || 'Could not resend the code.');
      }
    } catch (e) {
      setErr('Network error. Please try again.');
    }
    setBusy(false);
  };

  const backToPassword = () => {
    setStep('password');
    setCode('');
    setErr('');
    setInfo('');
  };

  if (step === 'code') {
    return (
      <AuthShell title="Verify It's You" subtitle={`We sent a 6-digit code to ${email.trim()}.`}>
        <form onSubmit={submitCode} className="space-y-4" noValidate>
          <div>
            <label htmlFor="login-code" className={authLabelCls}>
              Verification Code
            </label>
            <input
              id="login-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              autoFocus
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className={`${authInputCls} text-center tracking-[0.5em]`}
            />
            <p className="mt-1 text-xs faint">The code is valid for 10 minutes.</p>
          </div>

          <JunkMailHint />

          {err && (
            <div
              id="login-error"
              className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-700"
            >
              {err}
            </div>
          )}
          {info && (
            <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-xs text-green-700">
              {info}
            </div>
          )}

          <button id="login-code-submit" type="submit" disabled={busy || code.length !== 6} className={authBtnCls}>
            {busy ? 'Verifying…' : 'Verify & Sign In'}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between text-xs">
          <button type="button" onClick={backToPassword} disabled={busy} className="faint hover:underline">
            ← Back
          </button>
          <button
            type="button"
            onClick={resend}
            disabled={busy}
            className="font-medium text-blue-600 hover:underline"
          >
            Resend code
          </button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Sign In" subtitle="Welcome back. Please enter your details.">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="login-email" className={authLabelCls}>
            Email
          </label>
          <input
            id="login-email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={authInputCls}
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="login-password" className={authLabelCls}>
              Password
            </label>
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-xs font-medium text-blue-600 hover:underline"
            >
              Forgot?
            </button>
          </div>
          <input
            id="login-password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={authInputCls}
          />
        </div>

        {err && (
          <div
            id="login-error"
            className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-700"
          >
            {err}
          </div>
        )}

        <button id="login-submit" type="submit" disabled={busy} className={authBtnCls}>
          {busy ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      <PasskeySignIn />

      <p className="mt-4 text-center text-xs faint">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-medium text-black hover:underline">
          Create Account
        </Link>
      </p>

      {showForgotPassword && (
        <ForgotPasswordModal onClose={() => setShowForgotPassword(false)} />
      )}
    </AuthShell>
  );
}
