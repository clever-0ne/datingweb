import { NextResponse } from 'next/server';
import { readDb } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { describe } from '@/lib/passkeys';

/** The signed-in account's own passkeys. Never anyone else's. */
export async function GET(req) {
  const me = await currentUser(req);
  if (!me) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

  const db = await readDb();
  const mine = (db.passkeys || [])
    .filter((p) => p.accountId === me.account.id)
    .map((p) => ({
      id: p.id,
      name: describe(p),
      backedUp: !!p.backedUp,
      createdAt: p.createdAt,
      lastUsedAt: p.lastUsedAt,
    }));

  return NextResponse.json({ ok: true, passkeys: mine });
}
