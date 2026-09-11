import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { verifyPassword, createSession, USER_COOKIE } from '@/lib/auth';

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

  const res = NextResponse.json({
    ok: true,
    user: profile
      ? { id: profile.id, name: profile.name, email: profile.email, balance: profile.balance, kycStatus: profile.kycStatus }
      : { id: account.userId, name: account.name, email: account.email, balance: 0, kycStatus: 'not_submitted' },
  });
  res.cookies.set(USER_COOKIE, token, { httpOnly: true, sameSite: 'lax', path: '/' });
  return res;
}
