import { NextResponse } from 'next/server';
import { readDb, writeDb, isAuthed } from '@/lib/db';
import { INVESTMENT_PAYOUTS, PayoutError, adminDecide, redact } from '@/lib/payout';
import { deliverPush } from '@/lib/push';
import { sendPayoutNotificationEmail } from '@/lib/email-helpers';

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
    if (notification) await deliverPush(db, payout.userId, notification);

    // Send email notification with withdrawal code for approved payouts (non-blocking)
    if (body.status === 'approved') {
      try {
        const user = (db.users || []).find((u) => u.id === payout.userId);
        if (user) {
          // Generate withdrawal code (6 digits)
          const withdrawalCode = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');

          // Store code for verification later
          db.withdrawalCodes = db.withdrawalCodes || [];
          db.withdrawalCodes.push({
            payoutId: payout.id,
            code: withdrawalCode,
            type: 'investment',
            createdAt: new Date().toISOString(),
            used: false,
          });

          await sendPayoutNotificationEmail(user.email, user.name, payout.amount, 'investment', payout.id, withdrawalCode);
          await writeDb(db);
        }
      } catch (error) {
        console.error('Investment payout email failed:', error);
      }
    }

    return NextResponse.json({ ok: true, request: redact(payout) });
  } catch (err) {
    if (err instanceof PayoutError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
