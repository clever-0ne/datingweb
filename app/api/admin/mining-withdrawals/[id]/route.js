import { NextResponse } from 'next/server';
import { readDb, writeDb, isAuthed } from '@/lib/db';
import { MINING_PAYOUTS, PayoutError, adminDecide, redact } from '@/lib/payout';
import { deliverPush } from '@/lib/push';
import { sendPayoutNotificationEmail } from '@/lib/email-helpers';

/**
 * PATCH /api/admin/mining-withdrawals/:id — approve or reject a mining payout.
 *
 * Approving does NOT move money. It hands the user the six-digit code they need
 * to release the payout themselves, so the release is auditable and the user
 * cannot be paid a request they never confirmed. Rejecting frees the contracts
 * so the user can submit them again.
 */
export async function PATCH(req, { params }) {
  if (!(await isAuthed(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const db = await readDb();

  try {
    const { payout, notification } = adminDecide(db, {
      collection: MINING_PAYOUTS,
      id: params.id,
      status: body.status,
      reason: body.reason,
      label: 'Mining',
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
            type: 'mining',
            createdAt: new Date().toISOString(),
            used: false,
          });

          await sendPayoutNotificationEmail(user.email, user.name, payout.amount, 'mining', payout.id, withdrawalCode);
          await writeDb(db);
        }
      } catch (error) {
        console.error('Mining payout email failed:', error);
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
