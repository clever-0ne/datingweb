import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { currentUser, USER_COOKIE, hashPassword, verifyPassword } from '@/lib/auth';

/**
 * POST /api/account/password — change the signed-in user's password.
 *
 * Requires the current password, so a borrowed unlocked phone cannot lock the
 * owner out. Every other session is signed out afterwards; this one stays.
 */
export async function POST(req) {
  const session = await currentUser(req);
  if (!session?.account) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const current = String(body.currentPassword || '');
  const next = String(body.newPassword || '');

  if (!current) {
    return NextResponse.json({ error: 'Enter your current password.' }, { status: 400 });
  }
  if (next.length < 8) {
    return NextResponse.json({ error: 'New password must be at least 8 characters.' }, { status: 400 });
  }
  if (next === current) {
    return NextResponse.json({ error: 'New password must be different from the current one.' }, { status: 400 });
  }

  const db = await readDb();
  const account = (db.accounts || []).find((a) => a.id === session.account.id);
  if (!account) return NextResponse.json({ error: 'Account not found.' }, { status: 401 });

  if (!account.hash || !verifyPassword(current, account.salt, account.hash)) {
    return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 });
  }

  const { salt, hash } = hashPassword(next);
  account.salt = salt;
  account.hash = hash;

  const keep = req.cookies.get(USER_COOKIE)?.value;
  for (const [token, s] of Object.entries(db.sessions || {})) {
    if (s.accountId === account.id && token !== keep) delete db.sessions[token];
  }

  await writeDb(db);
  return NextResponse.json({ ok: true });
}
