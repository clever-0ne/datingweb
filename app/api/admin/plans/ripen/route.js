import { NextResponse } from 'next/server';
import { readDb, writeDb, isAuthed } from '@/lib/db';
import { miningStatus, investmentStatus } from '@/lib/account';

// POST /api/admin/plans/ripen { kind: 'mining' | 'investment', id }
// Matures a running plan immediately by moving its end date to now. Status,
// withdrawability and payouts all key off that date, so the plan then behaves
// exactly like one that ran its full term. Payout codes/approval still apply.
export async function POST(req) {
  if (!(await isAuthed(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const kind = body.kind === 'mining' ? 'mining' : body.kind === 'investment' ? 'investment' : null;
  const id = String(body.id || '');
  if (!kind || !id) return NextResponse.json({ error: 'kind and id are required.' }, { status: 400 });

  const db = await readDb();
  const list = kind === 'mining' ? db.mining || [] : db.investments || [];
  const plan = list.find((p) => p.id === id);
  if (!plan) return NextResponse.json({ error: 'Plan not found.' }, { status: 404 });

  const status = kind === 'mining' ? miningStatus(plan) : investmentStatus(plan);
  if (status !== 'active') return NextResponse.json({ error: 'This plan has already matured.' }, { status: 409 });

  const now = new Date().toISOString();
  if (kind === 'mining') plan.expiresAt = now;
  else plan.maturesAt = now;
  plan.ripenedByAdminAt = now;

  await writeDb(db);
  return NextResponse.json({ ok: true, kind, id, endsAt: now });
}
