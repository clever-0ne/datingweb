import { NextResponse } from 'next/server';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { readDb, writeDb } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { pushNotification } from '@/lib/notifications';
import { relyingParty, CHALLENGE_COOKIE, toRecord, describe } from '@/lib/passkeys';

/**
 * Step two: check the attestation and store the credential.
 *
 * Everything the browser sends is untrusted — the challenge it answered, the
 * origin it answered from, and the key it claims to hold are all re-checked
 * here against values the server chose. `verifyRegistrationResponse` is what
 * performs that check; this handler's job is to hand it the right expectations
 * and to store what comes back.
 */
export async function POST(req) {
  const me = await currentUser(req);
  if (!me) {
    return NextResponse.json({ error: 'Sign in before adding a passkey.' }, { status: 401 });
  }

  const expectedChallenge = req.cookies.get(CHALLENGE_COOKIE.register)?.value;
  if (!expectedChallenge) {
    return NextResponse.json(
      { error: 'That took too long. Please try again.' },
      { status: 400 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const { rpID, origin } = relyingParty(req);

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: body.response,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: false,
    });
  } catch (e) {
    return NextResponse.json(
      { error: 'That passkey could not be verified. Please try again.' },
      { status: 400 },
    );
  }

  if (!verification.verified || !verification.registrationInfo) {
    return NextResponse.json({ error: 'That passkey could not be verified.' }, { status: 400 });
  }

  const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

  const db = await readDb();
  db.passkeys = db.passkeys || [];

  if (db.passkeys.some((p) => p.id === credential.id)) {
    return NextResponse.json({ error: 'That passkey is already registered.' }, { status: 409 });
  }

  const record = {
    ...toRecord(credential),
    accountId: me.account.id,
    userId: me.account.userId,
    deviceType: credentialDeviceType,
    backedUp: credentialBackedUp,
    createdAt: new Date().toISOString(),
    lastUsedAt: null,
  };
  db.passkeys.push(record);

  if (me.profile) {
    pushNotification(db, me.profile.id, {
      title: 'Passkey added',
      body: `${describe(record)} can now sign in to your account.`,
      kind: 'success',
    });
  }

  await writeDb(db);

  const res = NextResponse.json({ ok: true, passkey: { id: record.id, name: describe(record) } });
  // Spent. Clearing it means the same attestation cannot be replayed.
  res.cookies.set(CHALLENGE_COOKIE.register, '', { path: '/', maxAge: 0 });
  return res;
}
