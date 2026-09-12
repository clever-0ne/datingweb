import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { currentUser } from '@/lib/auth';

/**
 * POST /api/account/photo — set the signed-in user's profile picture.
 *
 * The client resizes the image to a small square and sends it as a data URL.
 * It is stored directly on the user record (no separate file storage exists),
 * so it follows the account everywhere and persists until changed.
 */
export async function POST(req) {
  const session = await currentUser(req);
  if (!session?.profile) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const image = String(body.image || '').trim();

  // Data URL only, and small — a base64 photo bigger than this is almost
  // certainly an unmindful upload, not a profile picture.
  if (!image.startsWith('data:image/')) {
    return NextResponse.json({ error: 'Please choose an image file.' }, { status: 400 });
  }
  if (image.length > 200000) {
    return NextResponse.json({ error: 'That image is too large — choose a smaller one.' }, { status: 400 });
  }

  const db = await readDb();
  const user = (db.users || []).find((u) => u.id === session.profile.id);
  if (!user) return NextResponse.json({ error: 'Account not found.' }, { status: 401 });

  user.profileImage = image;
  await writeDb(db);

  return NextResponse.json({ ok: true, profileImage: image });
}
