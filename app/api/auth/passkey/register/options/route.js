import { NextResponse } from 'next/server';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { readDb } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { relyingParty, CHALLENGE_COOKIE, challengeCookie } from '@/lib/passkeys';

/**
 * Step one of adding a passkey to an existing account.
 *
 * Requires a signed-in session — a passkey is added TO an account, so the
 * account has to be established by password first. This is deliberately not a
 * way to create an account.
 */
export async function POST(req) {
  const me = await currentUser(req);
  if (!me) {
    return NextResponse.json({ error: 'Sign in before adding a passkey.' }, { status: 401 });
  }

  const { rpID, rpName } = relyingParty(req);
  const db = await readDb();
  const existing = (db.passkeys || []).filter((p) => p.accountId === me.account.id);

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userName: me.account.email,
    // Stable per account, and well under the 64-byte cap. The account id is
    // used rather than the email so that changing an email address cannot
    // orphan every passkey already registered.
    userID: new TextEncoder().encode(me.account.id),
    attestationType: 'none',
    // The authenticator refuses to register a credential the account already
    // has, which is what turns a double-click into "already added" instead of a
    // second dead credential in the list.
    excludeCredentials: existing.map((p) => ({ id: p.id, transports: p.transports || [] })),
    authenticatorSelection: {
      // Discoverable, because sign-in is usernameless — the browser has to be
      // able to offer the credential before anyone has typed an email.
      residentKey: 'required',
      userVerification: 'preferred',
    },
  });

  const res = NextResponse.json(options);
  res.cookies.set(CHALLENGE_COOKIE.register, options.challenge, challengeCookie);
  return res;
}
