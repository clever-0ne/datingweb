'use client';

import { useEffect, useState } from 'react';
import { Mail } from 'lucide-react';
import JunkMailHint from '@/components/JunkMailHint';

/**
 * The emailed withdrawal code. "Send code" asks the server to email one;
 * the server checks it when the withdrawal is submitted (lib/withdraw-otp.js).
 */
export default function WithdrawOtpField({ value, onChange }) {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // { ok, text }
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const send = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch('/api/withdrawals/otp', { method: 'POST' });
      const d = await r.json().catch(() => ({}));
      if (d.ok) {
        setSent(true);
        setCooldown(60);
        setMsg({ ok: true, text: 'Code sent to your email. It expires in 5 minutes.' });
      } else {
        setMsg({ ok: false, text: d.error || 'Could not send the code.' });
      }
    } catch {
      setMsg({ ok: false, text: 'Network error — try again.' });
    }
    setBusy(false);
  };

  return (
    <div className="mb-4 rounded-xl border p-4" style={{ borderColor: 'rgba(240,185,11,.3)', background: 'rgba(240,185,11,.06)' }}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <label htmlFor="withdraw-otp" className="text-sm font-medium hi">Email verification code</label>
        <button
          type="button"
          onClick={send}
          disabled={busy || cooldown > 0}
          className="flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-white disabled:opacity-60"
          style={{ background: 'var(--secondary)' }}
        >
          <Mail size={12} /> {busy ? 'Sending…' : cooldown > 0 ? `Resend in ${cooldown}s` : sent ? 'Resend code' : 'Send code'}
        </button>
      </div>
      <input
        id="withdraw-otp"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
        className="inp text-center tracking-[0.5em]"
        placeholder="••••••"
      />
      {msg && <p className={`mt-2 text-xs ${msg.ok ? 'grn' : 'text-red-500'}`} role="status">{msg.text}</p>}
      {sent && <JunkMailHint className="mt-2" />}
    </div>
  );
}
