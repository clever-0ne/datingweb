import { NextResponse } from 'next/server';
import { readDb, writeCollection, isAuthed } from '@/lib/db';

// Addresses the admin has just saved must never come back from a cache.
export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store, max-age=0' };

export async function GET(req) {
  if (!(await isAuthed(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const db = await readDb();
  return NextResponse.json({ settings: db.settings || { coins: [] } }, { headers: NO_STORE });
}

// POST /api/admin/settings — save deposit addresses and rates
export async function POST(req) {
  if (!(await isAuthed(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const coins = Array.isArray(body.coins) ? body.coins : null;
  if (!coins) return NextResponse.json({ error: 'Expected a coins array.' }, { status: 400 });

  for (const c of coins) {
    if (!c || typeof c.address !== 'string') {
      return NextResponse.json({ error: 'Each coin needs an address.' }, { status: 400 });
    }
    const rate = Number(c.rate);
    if (!Number.isFinite(rate) || rate <= 0) {
      return NextResponse.json({ error: `Rate for ${c.symbol || 'coin'} must be greater than 0.` }, { status: 400 });
    }
  }

  const db = await readDb();
  const settings = { ...(db.settings || {}), coins };

  // Written unconditionally, and read back, so "Saved." on screen can only mean
  // the row is actually in the database. The previous version went through
  // writeDb(), whose diff could skip the write entirely while still reporting
  // success — which is exactly how an address could be "saved" and never land.
  const stored = await writeCollection('settings', settings);
  if (!stored) {
    return NextResponse.json(
      { error: 'The address could not be stored. Please try again.' },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, settings }, { headers: NO_STORE });
}
