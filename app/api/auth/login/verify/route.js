import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { createSession, USER_COOKIE } from '@/lib/auth';
import { CHALLENGE_COOKIE, MAX_ATTEMPTS, codeMatches, pruneChallenges } from '@/lib/login-2fa';

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const code = String(body.code || '').trim();
  const challengeId = req.cookies.get(CHALLENGE_COOKIE)?.value;

  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: 'Enter the 6-digit code from your email.' }, { status: 400 });
  }

  const db = await readDb();
  const challenges = pruneChallenges(db);
  const challenge = challengeId && challenges[challengeId];

  if (!challenge) {
    await writeDb(db);
    return NextResponse.json(
      { error: 'Your code has expired. Please sign in again.', expired: true },
      { status: 401 },
    );
  }

  if (!codeMatches(code, challenge.codeHash)) {
    challenge.attempts += 1;
    const left = MAX_ATTEMPTS - challenge.attempts;
    if (left <= 0) {
      delete challenges[challengeId];
      await writeDb(db);
      const res = NextResponse.json(
        { error: 'Too many incorrect attempts. Please sign in again.', expired: true },
        { status: 401 },
      );
      res.cookies.delete(CHALLENGE_COOKIE);
      return res;
    }
    await writeDb(db);
    return NextResponse.json(
      { error: `Incorrect code. ${left} attempt${left === 1 ? '' : 's'} left.` },
      { status: 401 },
    );
  }

  delete challenges[challengeId];

  const account = (db.accounts || []).find((a) => a.id === challenge.accountId);
  const profile = account && (db.users || []).find((u) => u.id === account.userId);
  if (!account || (profile && profile.blocked)) {
    await writeDb(db);
    return NextResponse.json({ error: 'This account is unavailable.' }, { status: 403 });
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
  res.cookies.delete(CHALLENGE_COOKIE);
  return res;
}
