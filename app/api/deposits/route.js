import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { pushNotification } from '@/lib/notifications';
import { deliverPush } from '@/lib/push';
import { fmtUsd } from '@/lib/format';

const COINS = ['btc', 'eth', 'usdt', 'sol'];

// POST /api/deposits — create a pending deposit. The balance is NOT credited
// here; an admin must approve it from the console first.
export async function POST(req) {
  const session = await currentUser(req);
  if (!session?.profile) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const coin = String(body.coin || '').toLowerCase();
  const amount = Math.round(Number(body.amount) * 100) / 100;

  if (!COINS.includes(coin)) {
    return NextResponse.json({ error: 'Select a valid deposit method.' }, { status: 400 });
  }
  if (!(amount >= 10)) {
    return NextResponse.json({ error: 'Minimum deposit is $10.00.' }, { status: 400 });
  }

  const db = await readDb();
  db.deposits = db.deposits || [];
  const deposit = {
    id: `D-${Date.now()}`,
    userId: session.profile.id,
    user: session.profile.name,
    coin,
    amount,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  db.deposits.push(deposit);
  const notification = pushNotification(db, session.profile.id, {
    title: 'Deposit submitted',
    body: `Your ${coin.toUpperCase()} deposit of ${fmtUsd(amount)} is awaiting confirmation.`,
    kind: 'info',
  });
  await writeDb(db);
  await deliverPush(db, session.profile.id, notification);

  return NextResponse.json({ ok: true, deposit });
}
