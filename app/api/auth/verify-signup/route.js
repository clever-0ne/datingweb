import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { USER_COOKIE } from '@/lib/auth';
import { codeMatches } from '@/lib/login-2fa';
import { SIGNUP_COOKIE, SIGNUP_MAX_ATTEMPTS, prunePending, createAccount, announceSignup } from '@/lib/signup';

/** GET — which email the pending sign-up is for, so the page can show it. */
export async function GET(req) {
  const id = req.cookies.get(SIGNUP_COOKIE)?.value;
  if (!id) return NextResponse.json({ pending: false });
  const db = await readDb();
  const p = prunePending(db)[id];
  return NextResponse.json(p ? { pending: true, email: p.email } : { pending: false });
}

/** POST { code } — step 2 of sign-up: check the emailed code, create the account. */
export async function POST(req) {
  const id = req.cookies.get(SIGNUP_COOKIE)?.value;
  const body = await req.json().catch(() => ({}));
  const code = String(body.code || '').replace(/\D/g, '');

  const expired = NextResponse.json(
    { error: 'This sign-up has expired. Please register again.', restart: true },
    { status: 400 },
  );
  if (!id) return expired;
  if (code.length !== 6) return NextResponse.json({ error: 'Enter the 6-digit code.' }, { status: 400 });

  const db = await readDb();
  const pending = prunePending(db);
  const p = pending[id];
  if (!p) return expired;

  if (!codeMatches(code, p.codeHash)) {
    p.attempts = (p.attempts || 0) + 1;
    const left = SIGNUP_MAX_ATTEMPTS - p.attempts;
    if (left <= 0) delete pending[id];
    await writeDb(db);
    return NextResponse.json(
      left > 0
        ? { error: `Incorrect code. ${left} attempt${left === 1 ? '' : 's'} left.` }
        : { error: 'Too many incorrect codes. Please register again.', restart: true },
      { status: 400 },
    );
  }

  delete pending[id];
  if ((db.accounts || []).some((a) => a.email === p.email)) {
    await writeDb(db);
    return NextResponse.json({ error: 'An account with that email already exists.' }, { status: 409 });
  }

  const { token, userId, notification } = createAccount(db, p);
  await writeDb(db);
  await announceSignup(db, { userId, notification, name: p.name, email: p.email });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(USER_COOKIE, token, { httpOnly: true, sameSite: 'lax', path: '/' });
  res.cookies.delete(SIGNUP_COOKIE);
  return res;
}
