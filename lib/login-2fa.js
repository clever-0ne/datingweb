import crypto from 'crypto';

/** Email two-factor step for password logins. */
export const CHALLENGE_COOKIE = 'login_2fa';
export const CHALLENGE_TTL_MS = 10 * 60 * 1000;
export const MAX_ATTEMPTS = 5;

export function hashCode(code) {
  return crypto.createHash('sha256').update(String(code)).digest('hex');
}

/** Constant-time compare of an entered code against the stored hash. */
export function codeMatches(code, codeHash) {
  const a = Buffer.from(hashCode(code), 'hex');
  const b = Buffer.from(String(codeHash || ''), 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Drops expired challenges and returns the (always present) map. */
export function pruneChallenges(db) {
  const map = db.loginChallenges && typeof db.loginChallenges === 'object' && !Array.isArray(db.loginChallenges)
    ? db.loginChallenges
    : {};
  const now = Date.now();
  for (const [id, c] of Object.entries(map)) {
    if (!c || c.expires <= now) delete map[id];
  }
  db.loginChallenges = map;
  return map;
}
