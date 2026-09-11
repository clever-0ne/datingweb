import { NextResponse } from 'next/server';
import { readDb } from '@/lib/db';
import { currentUser } from '@/lib/auth';

/**
 * GET /api/receipts/:id — one order's receipt, for its owner only.
 *
 * `:id` accepts either the order id (O-…) or the receipt id (RCP-…), so a link
 * built from either field works. The ownership check is what stops one signed-in
 * user reading another's receipt by guessing an id.
 */
export async function GET(req, { params }) {
  const session = await currentUser(req);
  if (!session?.profile) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

  const db = await readDb();
  const wanted = String(params.id || '');
  const order = (db.orders || []).find(
    (o) => (o.id === wanted || o.receiptId === wanted) && o.userId === session.profile.id,
  );

  if (!order) return NextResponse.json({ error: 'Receipt not found.' }, { status: 404 });

  return NextResponse.json({
    ok: true,
    receipt: {
      receiptId: order.receiptId || order.id,
      orderId: order.id,
      item: order.item,
      ref: order.ref || null,
      type: order.type || 'Purchase',
      amount: Number(order.amount) || 0,
      status: order.status || 'completed',
      balanceAfter: Number(order.balanceAfter) || 0,
      issuedAt: order.createdAt,
      customer: { name: order.user || session.profile.name, email: order.email || session.profile.email },
      issuer: 'Tesla Capital',
    },
  });
}
