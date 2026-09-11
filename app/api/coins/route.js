import { NextResponse } from 'next/server';
import { readDb } from '@/lib/db';

// Reads live admin-edited settings, so it must never be prerendered — a cached
// copy would keep serving deposit addresses the admin has already changed.
export const dynamic = 'force-dynamic';

// GET /api/coins — the deposit addresses + rates configured by the admin in
// the console (settings.coins). Public: the user needs these to make a deposit.
export async function GET() {
  const db = await readDb();
  const coins = (db.settings?.coins || []).map((c) => ({
    id: String(c.symbol || '').toLowerCase(),
    symbol: c.symbol,
    name: c.name,
    network: c.network,
    address: c.address,
    rate: c.rate,
    icon: `/assets/coins/${String(c.symbol || '').toLowerCase()}.png`,
  }));
  return NextResponse.json({ ok: true, coins });
}
