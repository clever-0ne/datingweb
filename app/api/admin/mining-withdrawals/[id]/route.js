import { NextResponse } from 'next/server';
import { readDb, writeDb, isAuthed } from '@/lib/db';
import { MINING_PAYOUTS, PayoutError, adminDecide, redact } from '@/lib/payout';
import { deliverPush } from '@/lib/push';

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
    return NextResponse.json({ ok: true, request: redact(payout) });
  } catch (err) {
    if (err instanceof PayoutError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
