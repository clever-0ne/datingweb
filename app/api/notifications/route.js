import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { buildNotifications } from '@/lib/notifications';

// GET /api/notifications — the signed-in user's notifications, newest first.
export async function GET(req) {
  const session = await currentUser(req);
  if (!session?.profile) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  const db = await readDb();
  return NextResponse.json({ ok: true, notifications: buildNotifications(db, session.profile.id) });
}

// POST /api/notifications — mark the signed-in user's notifications as read.
// Called when the bell is opened. Pass { id } to clear just one.
export async function POST(req) {
  const session = await currentUser(req);
  if (!session?.profile) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const id = body.id ? String(body.id) : null;

  const db = await readDb();
  for (const n of db.notifications || []) {
    if (n.userId !== session.profile.id) continue;
    if (id && n.id !== id) continue;
    n.read = true;
  }
  await writeDb(db);

  return NextResponse.json({ ok: true, notifications: buildNotifications(db, session.profile.id) });
}
