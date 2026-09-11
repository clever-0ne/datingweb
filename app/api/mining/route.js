import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { MINING_TIERS, miningDaily } from '@/lib/plans';
import { buildMining } from '@/lib/account';
import { pushNotification } from '@/lib/notifications';
import { deliverPush } from '@/lib/push';
import { fmtUsd } from '@/lib/format';

// GET /api/mining — the signed-in user's mining contracts.
export async function GET(req) {
  const session = await currentUser(req);
  if (!session?.profile) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  const db = await readDb();
  return NextResponse.json({ ok: true, mining: buildMining(db, session.profile.id) });
}

// POST /api/mining — buy a contract: debit the cost immediately (no admin
// approval) and open a new active mining contract.
export async function POST(req) {
  const session = await currentUser(req);
  if (!session?.profile) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const tierId = String(body.tierId || '');
  const tier = MINING_TIERS.find((t) => t.id === tierId);
  if (!tier) return NextResponse.json({ error: 'Unknown contract tier.' }, { status: 400 });

  const db = await readDb();
  const user = (db.users || []).find((u) => u.id === session.profile.id);
  if (!user) return NextResponse.json({ error: 'Account not found.' }, { status: 401 });

  if (Number(user.balance) < tier.price) {
    return NextResponse.json({ error: 'Insufficient balance for this contract.' }, { status: 400 });
  }

  user.balance = Math.round((Number(user.balance) - tier.price) * 100) / 100;

  db.mining = db.mining || [];
  const contract = {
    id: `M-${Date.now()}`,
    userId: user.id,
    tierId: tier.id,
    tierName: tier.name,
    price: tier.price,
    totalReturn: tier.totalReturn,
    dailyEarnings: Math.round(miningDaily(tier) * 100) / 100,
    days: tier.days,
    hashrate: tier.hashrate,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + tier.days * 86400000).toISOString(),
  };
  db.mining.push(contract);
  const notification = pushNotification(db, user.id, {
    title: 'Mining contract activated',
    body: `${tier.name} is live — ${fmtUsd(tier.price)} invested, matures in ${tier.days} day${tier.days === 1 ? '' : 's'}.`,
    kind: 'success',
  });
  await writeDb(db);
  await deliverPush(db, user.id, notification);

  return NextResponse.json({ ok: true, balance: user.balance, contract: { ...contract, status: 'active' } });
}
