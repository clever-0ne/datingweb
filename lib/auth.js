import crypto from 'crypto';
import { readDb } from '@/lib/db';

export const USER_COOKIE = 'user_session';

// Re-exported so existing `from '@/lib/auth'` imports keep working.
export { hashPassword, verifyPassword } from './password';

/* ---------------- sessions ---------------- */
// These take the db object and mutate it; the caller owns the writeDb().

export function createSession(db, accountId) {
  const token = crypto.randomBytes(32).toString('hex');
  db.sessions = db.sessions || {};
  db.sessions[token] = { accountId, createdAt: new Date().toISOString() };
  return token;
}

export function destroySession(db, token) {
  if (token && db.sessions) delete db.sessions[token];
}

/**
 * The signed-in account plus its public user record, or null.
 *
 * ASYNC — the session lives in the database, so every caller must await it.
 */
export async function currentUser(req) {
  const token = req.cookies.get(USER_COOKIE)?.value;
  if (!token) return null;

  const db = await readDb();
  const session = (db.sessions || {})[token];
  if (!session) return null;

  const account = (db.accounts || []).find((a) => a.id === session.accountId);
  if (!account) return null;

  const profile = (db.users || []).find((u) => u.id === account.userId) || null;
  if (profile && profile.blocked) return null;

  return { account, profile };
}
