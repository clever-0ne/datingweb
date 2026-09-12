'use client';

import '@/app/auth.css';
import { useState } from 'react';
import AuthShell, { authInputCls, authLabelCls, authBtnCls } from '@/components/AuthShell';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const d = await res.json();
      if (d.ok) {
        // Full page load so the httpOnly session cookie is definitely sent
        // with the request for /admin, rather than relying on a soft navigation.
        window.location.href = '/admin';
        return;
      }
      setErr(d.error || 'Invalid admin credentials.');
    } catch (e) {
      setErr('Could not reach the server. Please try again.');
    }
    setBusy(false);
  };

  return (
    <AuthShell
      variant="console"
      title="Admin Sign In"
      subtitle="Restricted access. Staff credentials only."
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="admin-password" className={authLabelCls}>
            Admin password
          </label>
          <input
            id="admin-password"
            type="password"
            required
            autoFocus
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={authInputCls}
          />
        </div>

        {err && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-700">
            {err}
          </div>
        )}

        <button type="submit" disabled={busy} className={authBtnCls}>
          {busy ? 'Authenticating…' : 'Sign In'}
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-slate-500">
        Looking for your account?{' '}
        <a href="/login" className="font-medium text-black hover:underline">
          Customer sign in
        </a>
      </p>
    </AuthShell>
  );
}
