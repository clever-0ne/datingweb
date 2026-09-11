import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { INVESTMENT_PLANS, planReturn } from '@/lib/plans';
import { buildInvestments } from '@/lib/account';
import { pushNotification } from '@/lib/notifications';
import { deliverPush } from '@/lib/push';
import { fmtUsd } from '@/lib/format';

// GET /api/invest — the signed-in user's investment plans.
export async function GET(req) {
  const session = await currentUser(req);
  if (!session?.profile) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  const db = await readDb();
  return NextResponse.json({ ok: true, investments: buildInvestments(db, session.profile.id) });
}

// POST /api/invest — buy a plan: debit the principal immediately and open an
// investment that matures to principal × 3 after the plan's 3-day term.
export async function POST(req) {
  const session = await currentUser(req);
  if (!session?.profile) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const planId = String(body.planId || '');
  const plan = INVESTMENT_PLANS.find((p) => p.id === planId);
  if (!plan) return NextResponse.json({ error: 'Unknown plan.' }, { status: 400 });

  const db = await readDb();
  const user = (db.users || []).find((u) => u.id === session.profile.id);
  if (!user) return NextResponse.json({ error: 'Account not found.' }, { status: 401 });

  if (Number(user.balance) < plan.amount) {
    return NextResponse.json({ error: 'Insufficient balance for this plan.' }, { status: 400 });
  }

  user.balance = Math.round((Number(user.balance) - plan.amount) * 100) / 100;

  db.investments = db.investments || [];
  const investment = {
    id: `I-${Date.now()}`,
    userId: user.id,
    planId: plan.id,
    planName: plan.name,
    amount: plan.amount,
    roi: plan.roi,
    termDays: plan.termDays,
    returnAmount: planReturn(plan),
    createdAt: new Date().toISOString(),
    maturesAt: new Date(Date.now() + plan.termDays * 86400000).toISOString(),
  };
  db.investments.push(investment);
  const notification = pushNotification(db, user.id, {
    title: 'Investment plan activated',
    body: `${plan.name} is live — ${fmtUsd(plan.amount)} invested, matures in ${plan.termDays} day${plan.termDays === 1 ? '' : 's'}.`,
    kind: 'success',
  });
  await writeDb(db);
  await deliverPush(db, user.id, notification);

  return NextResponse.json({ ok: true, balance: user.balance, investment: { ...investment, status: 'active' } });
}
