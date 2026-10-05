import crypto from 'crypto';
import { createSession } from './auth';
import { pushNotification } from './notifications';
import { deliverPush, deliverAdminPush } from './push';
import { REFERRAL_BONUS } from './plans';
import { hashCode } from './login-2fa';
import { send2FACodeEmail, sendWelcomeEmail } from './email-helpers';

/**
 * Email-verified sign-up.
 *
 *   1. /api/auth/register validates the form and stores it in
 *      db.pendingSignups (keyed by a random id held in SIGNUP_COOKIE) with a
 *      hashed 6-digit code, then emails the code. No account exists yet.
 *   2. /api/auth/verify-signup checks the code and only then creates the
 *      account and signs the user in.
 */

export const SIGNUP_COOKIE = 'signup_pending';
export const SIGNUP_TTL_MS = 15 * 60 * 1000;
export const SIGNUP_MAX_ATTEMPTS = 5;
export const RESEND_COOLDOWN_MS = 60 * 1000;

export function newCode() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, '0');
}

/** Drop expired pending sign-ups; returns the (always present) map. */
export function prunePending(db) {
  const map = db.pendingSignups && typeof db.pendingSignups === 'object' && !Array.isArray(db.pendingSignups)
    ? db.pendingSignups
    : {};
  const now = Date.now();
  for (const [id, p] of Object.entries(map)) if (!p || p.expires <= now) delete map[id];
  db.pendingSignups = map;
  return map;
}

/** Give a pending sign-up a fresh code and email it. Caller owns writeDb(). */
export async function issueSignupCode(pending) {
  const code = newCode();
  pending.codeHash = hashCode(code);
  pending.expires = Date.now() + SIGNUP_TTL_MS;
  pending.attempts = 0;
  pending.sentAt = Date.now();
  const sent = await send2FACodeEmail(pending.email, code, 'signup');
  return sent?.success !== false;
}

/**
 * Turn a verified pending sign-up into a real account. Mutates db and returns
 * the session token; the caller writes the db, sets the cookie, then calls
 * announceSignup().
 */
export function createAccount(db, pending) {
  db.accounts = db.accounts || [];
  db.users = db.users || [];

  const referrer = pending.ref ? db.users.find((u) => u.id === pending.ref) : null;
  const userId = `TC-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  const now = new Date().toISOString();

  db.users.push({
    id: userId,
    name: pending.name,
    email: pending.email,
    phone: pending.phone,
    address: pending.address,
    role: 'user',
    balance: 0,
    profileImage: null,
    kycStatus: 'not_submitted',
    kycData: {},
    idImages: [],
    blocked: false,
    createdAt: now,
    dashboardStats: { totalProfit: 0, bonus: 0 },
    referredBy: referrer ? referrer.id : null,
    emailVerified: true,
  });

  const account = {
    id: `ACC-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
    userId,
    name: pending.name,
    email: pending.email,
    salt: pending.salt,
    hash: pending.hash,
    createdAt: now,
  };
  db.accounts.push(account);

  if (referrer) {
    referrer.balance = Math.round((Number(referrer.balance || 0) + REFERRAL_BONUS) * 100) / 100;
    pushNotification(db, referrer.id, {
      title: 'Referral bonus',
      body: `${pending.name} signed up with your link — $${REFERRAL_BONUS} added to your balance.`,
      kind: 'success',
    });
  }

  const token = createSession(db, account.id);
  const notification = pushNotification(db, userId, {
    title: 'Welcome to Tesla Capital',
    body: `Your account ${userId} is ready. Fund it to start investing.`,
    kind: 'success',
  });

  return { token, userId, notification };
}

/** Pushes and the welcome email — after the write, and never fatal. */
export async function announceSignup(db, { userId, notification, name, email }) {
  await deliverPush(db, userId, notification);
  await deliverAdminPush(db, {
    title: 'New user registered',
    body: `${name} (${email}) just created an account.`,
  });
  try {
    await sendWelcomeEmail(email, name);
  } catch (error) {
    console.error('Welcome email failed:', error);
  }
}
