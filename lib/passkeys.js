import { SITE } from './plans';

/**
 * WebAuthn (passkey) plumbing shared by the four ceremony routes.
 *
 * The cryptography itself is NOT here — every signature check goes through
 * `@simplewebauthn/server`, which parses CBOR, builds the COSE key and verifies
 * the assertion. Hand-rolling that is the classic way to ship an auth bypass:
 * the formats are fiddly enough that a plausible-looking implementation
 * silently accepts forgeries. This file only holds the parts that are specific
 * to this app — who the relying party is, where credentials live, and how a
 * challenge survives between the two halves of a ceremony.
 */

/* ---------------- ceremony cookies ----------------
   A ceremony is two requests: the browser asks for options, then posts the
   signed result back. The challenge has to travel between them, and it is the
   one value that makes a captured assertion useless on replay.

   It is held in an httpOnly cookie rather than in the database. Both would
   work; the cookie avoids a write on every sign-in attempt, including the
   failed ones, and it cannot be read or set by page scripts — so a script
   injected into the page cannot learn the challenge or plant one of its own.
   The two ceremonies get separate cookies so a registration challenge can
   never be replayed as an authentication challenge. */
export const CHALLENGE_COOKIE = {
  register: 'pk_reg_chal',
  authenticate: 'pk_auth_chal',
};

/** Five minutes is the WebAuthn spec's own suggestion, and is long enough to
 *  cover a fingerprint prompt the user has to retry. */
export const CHALLENGE_MAX_AGE = 300;

/** The cookie attributes every challenge is written with. `path: '/'` because
 *  the options and verify routes are siblings under /api/auth/passkey/. */
export const challengeCookie = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: CHALLENGE_MAX_AGE,
};

/* ---------------- relying party ---------------- */

/**
 * The relying party identity for this request — the domain a passkey is bound
 * to, and the origin it may be used from.
 *
 * Both are derived from the request instead of a hard-coded env var so that a
 * passkey registered on localhost verifies on localhost and one registered on
 * the deployed domain verifies there, with no config to keep in step. The
 * forwarded headers are read first because on Vercel the request reaching the
 * app has already been proxied, and its own Host is not the host the browser
 * thinks it is talking to — using it would make every check fail in production
 * while passing locally.
 *
 * `rpID` is the host WITHOUT the port: a passkey is scoped to a domain, and
 * `localhost:3000` is not a valid rpID.
 */
export function relyingParty(req) {
  const h = req.headers;
  const first = (v) => (v ? v.split(',')[0].trim() : '');

  const url = new URL(req.url);
  const proto = first(h.get('x-forwarded-proto')) || url.protocol.replace(':', '');
  const host = first(h.get('x-forwarded-host')) || first(h.get('host')) || url.host;

  return {
    rpID: host.split(':')[0],
    origin: `${proto}://${host}`,
    rpName: SITE.name,
  };
}

/* ---------------- storage shape ----------------
   `db.passkeys` holds one row per credential. The credential ID is the lookup
   key at sign-in: with a discoverable credential the browser sends no username,
   so the ID in the assertion is the only thing identifying the account.

   `publicKey` is stored base64url because this collection round-trips through
   JSON — a Buffer would come back as `{ type: 'Buffer', data: [...] }` and the
   verifier needs real bytes. */

export function toRecord(credential) {
  return {
    id: credential.id,
    publicKey: Buffer.from(credential.publicKey).toString('base64url'),
    counter: credential.counter,
    transports: credential.transports || [],
  };
}

/** The credential in the shape `verifyAuthenticationResponse` expects. */
export function fromRecord(record) {
  return {
    id: record.id,
    publicKey: new Uint8Array(Buffer.from(record.publicKey, 'base64url')),
    counter: Number(record.counter) || 0,
    transports: record.transports || [],
  };
}

/** A passkey's label, for the list the user manages. There is no way to ask an
 *  authenticator what it is called, so this names the platform the credential
 *  is most likely to live on, from the transports it reported. */
export function describe(record) {
  const t = record.transports || [];
  if (record.backedUp) return 'Synced passkey';
  if (t.includes('internal')) return 'This device';
  if (t.includes('hybrid')) return 'Phone or tablet';
  if (t.includes('usb') || t.includes('nfc') || t.includes('ble')) return 'Security key';
  return 'Passkey';
}
