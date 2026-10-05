'use client';

import { useState } from 'react';

/** Footer email sign-up — posts to /api/newsletter, which stores the address. */
export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // { ok, text }

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    try {
      const r = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const d = await r.json().catch(() => ({}));
      if (d.ok) {
        setEmail('');
        setMsg({ ok: true, text: 'Thanks — we will be in touch.' });
      } else {
        setMsg({ ok: false, text: d.error || 'Could not sign you up. Please try again.' });
      }
    } catch {
      setMsg({ ok: false, text: 'Network error. Please try again.' });
    }
    setBusy(false);
  };

  return (
    <form className="site-footer__top-newsletter-form" onSubmit={submit}>
      <div className="site-footer__top-newsletter-input-box">
        <input type="email" placeholder="Email Address" name="email" required maxLength={200} value={email} onChange={(e) => setEmail(e.target.value)} />
        <button type="submit" className="site-footer__top-newsletter-btn" disabled={busy}>
          {busy ? '…' : 'Go'}
        </button>
      </div>
      {msg && (
        <p role="status" style={{ marginTop: 10, fontSize: 13, color: msg.ok ? '#86efac' : '#fca5a5' }}>{msg.text}</p>
      )}
    </form>
  );
}
