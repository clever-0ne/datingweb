import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { verifyPassword, createSession, USER_COOKIE } from '@/lib/auth';
import { send2FACodeEmail } from '@/lib/email-helpers';

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

  const token = createSession(db, account.id);
  await writeDb(db);

  // Generate and send 2FA code (non-blocking)
  const code2fa = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
  try {
    await send2FACodeEmail(email, code2fa, 'login');
    console.log(`2FA code sent to ${email}: ${code2fa}`);
  } catch (error) {
    console.error('2FA email failed:', error);
  }

  const res = NextResponse.json({
    ok: true,
    user: profile
      ? { id: profile.id, name: profile.name, email: profile.email, balance: profile.balance, kycStatus: profile.kycStatus }
      : { id: account.userId, name: account.name, email: account.email, balance: 0, kycStatus: 'not_submitted' },
  });
  res.cookies.set(USER_COOKIE, token, { httpOnly: true, sameSite: 'lax', path: '/' });
  return res;
}
