'use client';

import { useState } from 'react';

const EMPTY = { name: '', email: '', phone: '', subject: '', message: '', company: '' };

/** The /contact form — posts to /api/contact, which emails the support inbox. */
export default function ContactForm({ supportEmail }) {
  const [f, setF] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // { ok, text }
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    try {
      const r = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(f),
      });
      const d = await r.json().catch(() => ({}));
      if (d.ok) {
        setF(EMPTY);
        setMsg({ ok: true, text: 'Thanks — your message has been sent. We will reply by email.' });
      } else {
        setMsg({ ok: false, text: d.error || 'Your message could not be sent. Please try again.' });
      }
    } catch {
      setMsg({ ok: false, text: 'Network error. Please try again.' });
    }
    setBusy(false);
  };

  return (
    <form className="comment-one__form" id="contactForm" onSubmit={submit}>
      <div className="row">
        <div className="col-xl-6">
          <div className="comment-form__input-box">
            <input type="text" placeholder="Your Name" name="name" required maxLength={100} value={f.name} onChange={set('name')} />
          </div>
        </div>
        <div className="col-xl-6">
          <div className="comment-form__input-box">
            <input type="email" placeholder="Email Address" name="email" required maxLength={200} value={f.email} onChange={set('email')} />
          </div>
        </div>
        <div className="col-xl-6">
          <div className="comment-form__input-box">
            <input type="tel" placeholder="Phone Number" name="phone" maxLength={40} value={f.phone} onChange={set('phone')} />
          </div>
        </div>
        <div className="col-xl-6">
          <div className="comment-form__input-box">
            <input type="text" placeholder="Subject" name="subject" required maxLength={150} value={f.subject} onChange={set('subject')} />
          </div>
        </div>
        <div className="col-xl-12">
          <div className="comment-form__input-box">
            <textarea name="message" placeholder="Write a Message" required maxLength={5000} value={f.message} onChange={set('message')}></textarea>
          </div>
        </div>
        {/* Honeypot: hidden from people, filled in by bots. */}
        <input type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" value={f.company} onChange={set('company')} style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, opacity: 0 }} />
      </div>

      <div className="row">
        <div className="col-xl-12 text-left">
          <button type="submit" className="thm-btn comment-form__btn" disabled={busy} style={busy ? { opacity: 0.6 } : undefined}>
            {busy ? 'sending…' : 'send a message'}
          </button>
          {msg && (
            <p role="status" style={{ marginTop: 15, fontWeight: 600, color: msg.ok ? '#15803d' : '#dc2626' }}>{msg.text}</p>
          )}
          <p style={{ marginTop: 15 }}>
            Or email us directly at <a href={`mailto:${supportEmail}`}>{supportEmail}</a>.
          </p>
        </div>
      </div>
    </form>
  );
}
