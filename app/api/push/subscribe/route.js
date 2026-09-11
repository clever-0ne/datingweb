import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { pushConfigured, saveSubscription, removeSubscription } from '@/lib/push';

// Reads the VAPID env at request time rather than baking in the build-time
// answer, which is what the account page needs to decide whether to show the
// toggle at all.
export const dynamic = 'force-dynamic';

// GET /api/push/subscribe — whether push is available, so the account page can
// hide the toggle entirely rather than offering something that cannot work.
export async function GET() {
  return NextResponse.json({ ok: true, configured: pushConfigured });
}

// POST /api/push/subscribe — register this device for push notifications.
export async function POST(req) {
  const session = await currentUser(req);
  if (!session?.profile) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const subscription = body.subscription;
  if (!subscription?.endpoint) {
    return NextResponse.json({ error: 'A push subscription is required.' }, { status: 400 });
  }

  const db = await readDb();
  saveSubscription(db, session.profile.id, subscription, req.headers.get('user-agent'));
  await writeDb(db);

  return NextResponse.json({ ok: true });
}

// DELETE /api/push/subscribe — opt this device out.
export async function DELETE(req) {
  const session = await currentUser(req);
  if (!session?.profile) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const db = await readDb();
  removeSubscription(db, session.profile.id, body.endpoint);
  await writeDb(db);

  return NextResponse.json({ ok: true });
}
