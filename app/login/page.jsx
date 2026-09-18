'use client';

import '@/app/auth.css';
import { useState } from 'react';
import Link from 'next/link';
import AuthShell, { authInputCls, authLabelCls, authBtnCls } from '@/components/AuthShell';
import { PasskeySignIn } from '@/components/PasskeyPanel';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const d = await r.json();
      if (d.ok) {
        window.location.href = '/dashboard';
        return;
      }
      setErr(d.error || 'Unable to sign in.');
    } catch (e) {
      setErr('Network error. Please try again.');
    }
    setBusy(false);
  };

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
          <label htmlFor="login-password" className={authLabelCls}>
            Password
          </label>
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
    </AuthShell>
  );
}
