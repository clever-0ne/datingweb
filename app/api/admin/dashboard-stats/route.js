import { NextResponse } from 'next/server';
import { readDb, writeDb, isAuthed } from '@/lib/db';

export async function GET(req) {
  if (!(await isAuthed(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const db = await readDb();
  return NextResponse.json({ dashboardStats: db.dashboardStats || {} });
}

// POST /api/admin/dashboard-stats — the numbers shown on the user dashboard cards
export async function POST(req) {
  if (!(await isAuthed(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const next = {};
  for (const key of ['totalProfit', 'bonus', 'totalDeposit', 'totalWithdrawal']) {
    const value = Number(body[key]);
    if (!Number.isFinite(value)) {
      return NextResponse.json({ error: `${key} must be a number.` }, { status: 400 });
    }
    next[key] = value;
  }

  const db = await readDb();
  db.dashboardStats = next;
  await writeDb(db);
  return NextResponse.json({ ok: true, dashboardStats: next });
}
