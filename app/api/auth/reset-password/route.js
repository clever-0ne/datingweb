import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { hashPassword } from '@/lib/password';

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const token = String(body.token || '').trim();
  const password = String(body.password || '');

  if (!token) {
    return NextResponse.json({ error: 'Reset token is required.' }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
  }

  const db = await readDb();
  const resetRecord = (db.passwordResets || []).find((r) => r.token === token);

  if (!resetRecord) {
    return NextResponse.json({ error: 'Invalid or expired reset token.' }, { status: 400 });
  }

  // Check if token has expired
  if (Date.now() > resetRecord.expiresAt) {
    // Remove expired token
    db.passwordResets = db.passwordResets.filter((r) => r.token !== token);
    await writeDb(db);
    return NextResponse.json({ error: 'Reset token has expired.' }, { status: 400 });
  }

  const account = (db.accounts || []).find((a) => a.email === resetRecord.email);

  if (!account) {
    return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
  }

  // Update password
  const { salt, hash } = hashPassword(password);
  account.salt = salt;
  account.hash = hash;

  // Remove used reset token
  db.passwordResets = db.passwordResets.filter((r) => r.token !== token);

  await writeDb(db);

  return NextResponse.json({ ok: true, message: 'Password has been reset successfully.' });
}
