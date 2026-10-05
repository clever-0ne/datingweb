import { NextResponse } from 'next/server';
import { sendContactMessageEmail } from '@/lib/email-helpers';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clip = (v, n) => String(v || '').trim().slice(0, n);

// POST /api/contact — the /contact form. Emails the support inbox.
export async function POST(req) {
  const body = await req.json().catch(() => ({}));

  // Honeypot filled in: a bot. Pretend it worked so it moves on.
  if (body.company) return NextResponse.json({ ok: true });

  const name = clip(body.name, 100);
  const email = clip(body.email, 200).toLowerCase();
  const phone = clip(body.phone, 40);
  const subject = clip(body.subject, 150);
  const message = clip(body.message, 5000);

  if (!name) return NextResponse.json({ error: 'Please enter your name.' }, { status: 400 });
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  if (!subject) return NextResponse.json({ error: 'Please enter a subject.' }, { status: 400 });
  if (message.length < 5) return NextResponse.json({ error: 'Please write a message.' }, { status: 400 });

  const sent = await sendContactMessageEmail({ name, email, phone, subject, message });
  if (!sent.success) {
    return NextResponse.json({ error: 'Your message could not be sent. Please email us directly.' }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
