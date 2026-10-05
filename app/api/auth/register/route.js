import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { readDb, writeDb } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { SIGNUP_COOKIE, SIGNUP_TTL_MS, prunePending, issueSignupCode } from '@/lib/signup';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/auth/register — step 1 of sign-up. Validates the form, holds it as
 * a pending sign-up and emails a code. The account is created by
 * /api/auth/verify-signup once the code comes back (see lib/signup.js).
 */
export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const phone = String(body.phone || '').trim();
  const address = String(body.address || '').trim();
  const ref = String(body.ref || '').trim();

  if (!name) return NextResponse.json({ error: 'Please enter your name.' }, { status: 400 });
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
  }
  if (!phone) return NextResponse.json({ error: 'Please enter your phone number.' }, { status: 400 });
  if (!address) return NextResponse.json({ error: 'Please enter your address.' }, { status: 400 });

  const db = await readDb();
  if ((db.accounts || []).some((a) => a.email === email)) {
    return NextResponse.json({ error: 'An account with that email already exists.' }, { status: 409 });
  }

  const pending = prunePending(db);
  // One pending sign-up per email: starting again replaces the old one.
  for (const [id, p] of Object.entries(pending)) if (p.email === email) delete pending[id];

  const id = crypto.randomBytes(24).toString('hex');
  const { salt, hash } = hashPassword(password);
  pending[id] = { name, email, phone, address, ref, salt, hash };

  const sent = await issueSignupCode(pending[id]);
  if (!sent) {
    return NextResponse.json({ error: 'We could not send the verification email. Please try again.' }, { status: 502 });
  }
  await writeDb(db);

  const res = NextResponse.json({ ok: true, verify: true });
  res.cookies.set(SIGNUP_COOKIE, id, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: Math.floor(SIGNUP_TTL_MS / 1000),
  });
  return res;
}
