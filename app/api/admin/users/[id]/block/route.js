import { NextResponse } from 'next/server';
import { readDb, writeDb, isAuthed } from '@/lib/db';

// PATCH /api/admin/users/:id/block — block or unblock a user
export async function PATCH(req, { params }) {
  if (!(await isAuthed(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = await readDb();
  const user = (db.users || []).find((u) => u.id === params.id);
  if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  user.blocked = !!body.blocked;

  await writeDb(db);
  return NextResponse.json({ ok: true, user });
}
