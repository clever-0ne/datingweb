import { NextResponse } from 'next/server';
import { readDb, writeDb, isAuthed } from '@/lib/db';
import { pushConfigured, saveSubscription, removeSubscription, ADMIN_AUDIENCE } from '@/lib/push';

/**
 * The admin console's half of /api/push/subscribe.
 *
 * Same three verbs and the same storage, but gated on the admin cookie rather
 * than a user session, and filed under ADMIN_AUDIENCE instead of a user id. The
 * console cannot use the user endpoint: it has no account to sign in with.
 */

// Reads VAPID env at request time, so a key added after the build still works.
export const dynamic = 'force-dynamic';

// GET /api/admin/push/subscribe — whether push is available at all, so the
// console can hide the toggle rather than offering something that cannot work.
export async function GET(req) {
  if (!(await isAuthed(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ ok: true, configured: pushConfigured });
}

// POST /api/admin/push/subscribe — register this device for console alerts.
export async function POST(req) {
  if (!(await isAuthed(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const subscription = body.subscription;
  if (!subscription?.endpoint) {
    return NextResponse.json({ error: 'A push subscription is required.' }, { status: 400 });
  }

  const db = await readDb();
  saveSubscription(db, ADMIN_AUDIENCE, subscription, req.headers.get('user-agent'));
  await writeDb(db);

  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/push/subscribe — opt this device out.
export async function DELETE(req) {
  if (!(await isAuthed(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const db = await readDb();
  removeSubscription(db, ADMIN_AUDIENCE, body.endpoint);
  await writeDb(db);

  return NextResponse.json({ ok: true });
}
