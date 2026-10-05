import { NextResponse } from 'next/server';
import { readDb, writeDb, isAuthed } from '@/lib/db';
import { INVESTMENT_PAYOUTS, PayoutError, adminDecide, redact } from '@/lib/payout';
import { deliverPush } from '@/lib/push';

/**
 * PATCH /api/admin/investment-withdrawals/:id — approve or reject an
 * investment payout. Same rules as the mining queue: approval releases a code
 * to the user, and only the user's confirmation moves money.
 */
export async function PATCH(req, { params }) {
  if (!(await isAuthed(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const db = await readDb();

  try {
    const { payout, notification } = adminDecide(db, {
      collection: INVESTMENT_PAYOUTS,
      id: params.id,
      status: body.status,
      reason: body.reason,
      label: 'Investment',
    });

    await writeDb(db);

    // adminDecide already put the payout's real code in the notification body.
    // Don't replace it: confirmRequest checks payout.code, so any other code
    // shown to the user can never release the payout.
    if (notification) await deliverPush(db, payout.userId, notification);

    // The code goes to the in-app bell only, never email — the payout screens
    // tell users to watch the bell, and a code in a mailbox is easier to steal.

    return NextResponse.json({ ok: true, request: redact(payout) });
  } catch (err) {
    if (err instanceof PayoutError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
