import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { readDb, writeDb } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { pushNotification } from '@/lib/notifications';
import { deliverPush } from '@/lib/push';
import { fmtUsd, round2 } from '@/lib/format';

// POST /api/purchase — instant balance debit for non-approval orders
// (investment funds, vehicle orders). Records an order and deducts immediately.
export async function POST(req) {
  const session = await currentUser(req);
  if (!session?.profile) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const amount = Math.round(Number(body.amount) * 100) / 100;
  const item = String(body.item || 'Purchase').trim();
  const type = String(body.type || 'investment').trim();
  const ref = String(body.ref || '').trim();

  if (!(amount > 0)) {
    return NextResponse.json({ error: 'Enter a valid amount.' }, { status: 400 });
  }

  const db = await readDb();
  const user = (db.users || []).find((u) => u.id === session.profile.id);
  if (!user) return NextResponse.json({ error: 'Account not found.' }, { status: 401 });

  if (Number(user.balance) < amount) {
    return NextResponse.json({ error: 'Insufficient balance for this purchase.' }, { status: 400 });
  }

  user.balance = round2(Number(user.balance) - amount);

  // Every order gets its own receipt id, so a purchase can be looked up and
  // printed later rather than existing only as a line in the ledger.
  const order = {
    id: `O-${Date.now()}`,
    receiptId: `RCP-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
    userId: user.id,
    user: user.name,
    email: user.email,
    item,
    ref: ref || null,
    amount,
    type,
    status: 'completed',
    balanceAfter: user.balance,
    createdAt: new Date().toISOString(),
  };

  db.orders = db.orders || [];
  db.orders.push(order);
  const notification = pushNotification(db, user.id, {
    title: 'Order placed',
    body: `${item} — ${fmtUsd(amount)} debited from your balance. Receipt ${order.receiptId}.`,
    kind: 'success',
  });
  await writeDb(db);
  await deliverPush(db, user.id, notification);

  return NextResponse.json({ ok: true, balance: user.balance, order });
}
