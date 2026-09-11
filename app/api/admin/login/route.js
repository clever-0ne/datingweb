import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { readDb, writeDb } from '@/lib/db';
import { verifyPassword } from '@/lib/password';

// POST /api/admin/login — the admin password is stored hashed (see lib/db.js),
// never in plaintext.
//
// A password is the only factor. There is no admin email to check: the account
// is a single fixed record, so the email added nothing an attacker could not
// already guess, and it only told them a valid address to target.
export async function POST(req) {
  const { password } = await req.json();
  const db = await readDb();

  const ok =
    db.admin &&
    verifyPassword(String(password ?? ''), db.admin.salt, db.admin.hash);

  if (!ok) {
    return NextResponse.json({ ok: false, error: 'Invalid credentials' }, { status: 401 });
  }

  const token = randomBytes(32).toString('hex');
  db.admin.token = token;
  await writeDb(db);

  const res = NextResponse.json({ ok: true });
  res.cookies.set('admin_session', token, { httpOnly: true, sameSite: 'lax', path: '/' });
  return res;
}
