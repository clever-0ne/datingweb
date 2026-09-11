import { NextResponse } from 'next/server';
import { readDb, writeDb, isAuthed } from '@/lib/db';

export async function GET(req) {
  if (!(await isAuthed(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const db = await readDb();
  return NextResponse.json({ settings: db.settings || { coins: [] } });
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
  db.settings = { ...(db.settings || {}), coins };
  await writeDb(db);
  return NextResponse.json({ ok: true, settings: db.settings });
}
