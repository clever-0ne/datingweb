import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';

export async function POST() {
  const db = await readDb();
  db.admin.token = null;
  await writeDb(db);
  const res = NextResponse.json({ ok: true });
  res.cookies.set('admin_session', '', { maxAge: 0, path: '/' });
  return res;
}
