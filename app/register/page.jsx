'use client';

import '@/app/auth.css';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AuthShell, { authInputCls, authLabelCls, authBtnCls } from '@/components/AuthShell';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [ref, setRef] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setRef(new URLSearchParams(window.location.search).get('ref') || '');
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const r = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          phone: phone.trim(),
          address: address.trim(),
          ref: ref || new URLSearchParams(window.location.search).get('ref') || '',
        }),
      });
      const d = await r.json();
      if (d.ok) {
        window.location.href = '/dashboard';
        return;
      }
      setErr(d.error || 'Unable to create your account.');
    } catch (e) {
      setErr('Network error. Please try again.');
    }
    setBusy(false);
  };

  return (
    <AuthShell title="Create Account" subtitle="Open your Tesla Capital account in a minute.">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="reg-name" className={authLabelCls}>
            Full name
          </label>
          <input
            id="reg-name"
            type="text"
            required
            autoComplete="name"
            placeholder="Jane Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={authInputCls}
          />
        </div>

        <div>
          <label htmlFor="reg-email" className={authLabelCls}>
            Email
          </label>
          <input
            id="reg-email"
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
          <label htmlFor="reg-password" className={authLabelCls}>
            Password
          </label>
          <input
            id="reg-password"
            type="password"
            required
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={authInputCls}
          />
        </div>

        <div>
          <label htmlFor="reg-phone" className={authLabelCls}>
            Phone number
          </label>
          <input
            id="reg-phone"
            type="tel"
            required
            autoComplete="tel"
            placeholder="+1 555 000 0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={authInputCls}
          />
        </div>

        <div>
          <label htmlFor="reg-address" className={authLabelCls}>
            Address
          </label>
          <input
            id="reg-address"
            type="text"
            required
            autoComplete="street-address"
            placeholder="Street, City, Country"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className={authInputCls}
          />
        </div>

        <div>
          <label htmlFor="reg-ref" className={authLabelCls}>
            Referral code <span className="font-normal mut">(optional)</span>
          </label>
          <input
            id="reg-ref"
            type="text"
            autoComplete="off"
            placeholder="TC-XXXXXXX"
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            className={authInputCls}
          />
        </div>

        {err && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-700">
            {err}
          </div>
        )}

        <button type="submit" disabled={busy} className={authBtnCls}>
          {busy ? 'Creating account…' : 'Create Account'}
        </button>
      </form>

      <p className="mt-4 text-center text-xs faint">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-black hover:underline">
          Sign In
        </Link>
      </p>
    </AuthShell>
  );
}
