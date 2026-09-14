import { NextResponse } from 'next/server';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { readDb, writeDb } from '@/lib/db';
import { createSession, USER_COOKIE } from '@/lib/auth';
import { relyingParty, CHALLENGE_COOKIE, fromRecord } from '@/lib/passkeys';

/**
 * Step two of passkey sign-in: verify the assertion and open a session.
 *
 * Every failure returns the same message. The distinction between "no such
 * credential", "wrong signature" and "suspended account" is useful to an
 * attacker and to nobody else, and the credential ID in the request is
 * attacker-supplied — echoing it back would confirm which IDs exist.
 */
const REFUSED = { error: 'That passkey was not recognised.' };

export async function POST(req) {
  const expectedChallenge = req.cookies.get(CHALLENGE_COOKIE.authenticate)?.value;
  if (!expectedChallenge) {
    return NextResponse.json({ error: 'That took too long. Please try again.' }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const credentialID = body?.response?.id;
  if (!credentialID) return NextResponse.json(REFUSED, { status: 400 });

  const db = await readDb();
  const record = (db.passkeys || []).find((p) => p.id === credentialID);
  if (!record) return NextResponse.json(REFUSED, { status: 401 });

  const account = (db.accounts || []).find((a) => a.id === record.accountId);
  if (!account) return NextResponse.json(REFUSED, { status: 401 });

  const profile = (db.users || []).find((u) => u.id === account.userId);
  if (profile && profile.blocked) {
    return NextResponse.json({ error: 'This account has been suspended.' }, { status: 403 });
  }

  const { rpID, origin } = relyingParty(req);

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response: body.response,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: fromRecord(record),
      requireUserVerification: false,
    });
  } catch (e) {
    return NextResponse.json(REFUSED, { status: 401 });
  }

  if (!verification.verified) return NextResponse.json(REFUSED, { status: 401 });

  const { newCounter } = verification.authenticationInfo;

  // The signature counter exists to catch a cloned authenticator: a real one
  // increments on every use, so a value that fails to advance means the same
  // credential is being replayed from somewhere else. Zero is exempt because
  // some platforms — Apple's among them — never increment at all, and treating
  // that as a clone would lock those users out.
  if (newCounter !== 0 && newCounter <= (Number(record.counter) || 0)) {
    return NextResponse.json(REFUSED, { status: 401 });
  }

  record.counter = newCounter;
  record.lastUsedAt = new Date().toISOString();

  const token = createSession(db, account.id);
  await writeDb(db);

  const res = NextResponse.json({
    ok: true,
    user: profile
      ? { id: profile.id, name: profile.name, email: profile.email, balance: profile.balance, kycStatus: profile.kycStatus }
      : { id: account.userId, name: account.name, email: account.email, balance: 0, kycStatus: 'not_submitted' },
  });
  res.cookies.set(USER_COOKIE, token, { httpOnly: true, sameSite: 'lax', path: '/' });
  res.cookies.set(CHALLENGE_COOKIE.authenticate, '', { path: '/', maxAge: 0 });
  return res;
}
