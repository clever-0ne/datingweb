import crypto from 'crypto';
import { hashCode, codeMatches } from './login-2fa';

/**
 * Emailed one-time code required to open a withdrawal. Stored hashed in
 * db.withdrawOtps, keyed by userId: one live code per user.
 */

export const OTP_TTL_MS = 5 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_COOLDOWN_MS = 60 * 1000;

function otps(db) {
  const map = db.withdrawOtps && typeof db.withdrawOtps === 'object' && !Array.isArray(db.withdrawOtps)
    ? db.withdrawOtps
    : {};
  const now = Date.now();
  for (const [k, v] of Object.entries(map)) if (!v || v.expires <= now) delete map[k];
  db.withdrawOtps = map;
  return map;
}

/** Seconds until another code may be sent, or 0. */
export function cooldownLeft(db, userId) {
  const o = otps(db)[userId];
  return o ? Math.max(0, Math.ceil((o.sentAt + OTP_COOLDOWN_MS - Date.now()) / 1000)) : 0;
}

/** Create a fresh code for the user; returns the plain code to email. */
export function issueOtp(db, userId) {
  const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  otps(db)[userId] = { codeHash: hashCode(code), expires: Date.now() + OTP_TTL_MS, attempts: 0, sentAt: Date.now() };
  return code;
}

/**
 * Check (and on success consume) the user's code. Returns null when it is
 * valid, otherwise the error message to show. Mutates db either way.
 */
export function checkOtp(db, userId, code) {
  const map = otps(db);
  const o = map[userId];
  if (!o) return 'Request a withdrawal code first — it is sent to your email.';
  if (!codeMatches(String(code || '').replace(/\D/g, ''), o.codeHash)) {
    o.attempts += 1;
    const left = OTP_MAX_ATTEMPTS - o.attempts;
    if (left <= 0) {
      delete map[userId];
      return 'Too many incorrect codes. Request a new one.';
    }
    return `Incorrect code. ${left} attempt${left === 1 ? '' : 's'} left.`;
  }
  delete map[userId];
  return null;
}
