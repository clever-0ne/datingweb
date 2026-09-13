import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { pushNotification } from '@/lib/notifications';
import { deliverPush, deliverAdminPush } from '@/lib/push';
import { fmtUsd } from '@/lib/format';

const COINS = ['btc', 'eth', 'usdt', 'sol'];

// POST /api/withdrawals — create a pending withdrawal. The balance is NOT
// debited here; an admin must approve it, which is when the debit happens.
export async function POST(req) {
  const session = await currentUser(req);
  if (!session?.profile) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const coin = String(body.coin || '').toLowerCase();
  const amount = Math.round(Number(body.amount) * 100) / 100;
  const address = String(body.address || '').trim();

  if (!COINS.includes(coin)) {
    return NextResponse.json({ error: 'Select a valid withdrawal method.' }, { status: 400 });
  }
  if (!(amount >= 10)) {
    return NextResponse.json({ error: 'Minimum withdrawal is $10.00.' }, { status: 400 });
  }
  if (!address) {
    return NextResponse.json({ error: 'Enter a destination wallet address.' }, { status: 400 });
  }

  const db = await readDb();
  const user = (db.users || []).find((u) => u.id === session.profile.id);
  if (user && Number(user.balance) < amount) {
    return NextResponse.json({ error: 'Insufficient balance for this withdrawal.' }, { status: 400 });
  }

  db.withdrawals = db.withdrawals || [];
  const withdrawal = {
    id: `W-${Date.now()}`,
    userId: session.profile.id,
    user: session.profile.name,
    coin,
    address,
    amount,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  db.withdrawals.push(withdrawal);
  const notification = pushNotification(db, session.profile.id, {
    title: 'Withdrawal requested',
    body: `Your ${coin.toUpperCase()} withdrawal of ${fmtUsd(amount)} is pending review.`,
    kind: 'info',
  });
  await writeDb(db);
  await deliverPush(db, session.profile.id, notification);

  // Same reasoning as a deposit: this is the request landing in the console's
  // review queue, which is the only moment an admin can act on it.
  await deliverAdminPush(db, {
    title: 'Withdrawal awaiting approval',
    body: `${session.profile.name} requested a ${coin.toUpperCase()} withdrawal of ${fmtUsd(amount)}.`,
  });

  return NextResponse.json({ ok: true, withdrawal });
}
