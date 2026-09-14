import { NextResponse } from 'next/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { relyingParty, CHALLENGE_COOKIE, challengeCookie } from '@/lib/passkeys';

/**
 * Step one of signing in with a passkey.
 *
 * Public, and takes no email. An empty `allowCredentials` is what makes the
 * sign-in usernameless: the browser is told "show every passkey you hold for
 * this site" rather than "show the ones belonging to this account", and the
 * account is identified from the credential that comes back. That also means
 * this endpoint reveals nothing — it answers identically for a site with a
 * million users and one with none, so it cannot be used to probe for accounts.
 */
export async function POST(req) {
  const { rpID } = relyingParty(req);

  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials: [],
    userVerification: 'preferred',
  });

  const res = NextResponse.json(options);
  res.cookies.set(CHALLENGE_COOKIE.authenticate, options.challenge, challengeCookie);
  return res;
}
