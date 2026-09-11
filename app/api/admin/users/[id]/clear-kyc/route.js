import { NextResponse } from 'next/server';
import { readDb, writeDb, isAuthed } from '@/lib/db';

// POST /api/admin/users/:id/clear-kyc — wipe KYC documents and reset status
export async function POST(req, { params }) {
  if (!(await isAuthed(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = await readDb();
  const user = (db.users || []).find((u) => u.id === params.id);
  if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

  user.kycStatus = 'not_submitted';
  user.kycData = {};
  user.idImages = [];

  await writeDb(db);
  return NextResponse.json({ ok: true, user });
}
