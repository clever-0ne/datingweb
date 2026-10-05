import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { verifyPassword } from '@/lib/auth';
import { send2FACodeEmail } from '@/lib/email-helpers';
import { CHALLENGE_COOKIE, CHALLENGE_TTL_MS, hashCode, pruneChallenges } from '@/lib/login-2fa';

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');

  if (!email || !password) {
    return NextResponse.json({ error: 'Enter your email and password.' }, { status: 400 });
  }

  const db = await readDb();
  const account = (db.accounts || []).find((a) => a.email === email);

  // Same message either way so the response can't be used to enumerate accounts.
  if (!account || !verifyPassword(password, account.salt, account.hash)) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
  }

  const profile = (db.users || []).find((u) => u.id === account.userId);
  if (profile && profile.blocked) {
    return NextResponse.json({ error: 'This account has been suspended.' }, { status: 403 });
  }

  // Password is correct — no session yet. Email a one-time code; the session is
  // only created by /api/auth/login/verify once that code is entered.
  const challenges = pruneChallenges(db);
  const challengeId = crypto.randomBytes(24).toString('hex');
  const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');

  const sent = await send2FACodeEmail(email, code, 'login');
  if (!sent.success) {
    return NextResponse.json({ error: 'Could not send your verification code. Please try again.' }, { status: 502 });
  }

  challenges[challengeId] = {
    accountId: account.id,
    codeHash: hashCode(code),
    expires: Date.now() + CHALLENGE_TTL_MS,
    attempts: 0,
  };
  await writeDb(db);

  const res = NextResponse.json({ ok: true, twoFactor: true });
  res.cookies.set(CHALLENGE_COOKIE, challengeId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: CHALLENGE_TTL_MS / 1000,
  });
  return res;
}
