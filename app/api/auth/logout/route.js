import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { destroySession, USER_COOKIE } from '@/lib/auth';

export async function POST(req) {
  const token = req.cookies.get(USER_COOKIE)?.value;
  if (token) {
    const db = await readDb();
    destroySession(db, token);
    await writeDb(db);
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(USER_COOKIE, '', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 });
  return res;
}
