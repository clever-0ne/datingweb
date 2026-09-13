import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { buildMining } from '@/lib/account';
import { fmtUsd } from '@/lib/format';
import {
  MINING_PAYOUTS, PayoutError, createRequest, confirmRequest, redact,
} from '@/lib/payout';
import { deliverPush, deliverAdminPush } from '@/lib/push';

/**
 * POST /api/mining/withdraw — the two-step mining payout.
 *
 *   { action: 'request' }             claim every matured contract
 *   { action: 'confirm', id, code }   release an admin-approved request
 *
 * The rules themselves live in lib/payout.js, shared with investments.
 */
export async function POST(req) {
  const session = await currentUser(req);
  if (!session?.profile) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const action = String(body.action || 'request');
  const userId = session.profile.id;

  const db = await readDb();

  try {
    if (action === 'confirm') {
      const { balance, payout, notification } = confirmRequest(db, {
        collection: MINING_PAYOUTS,
        userId,
        id: body.id,
        code: body.code,
      });
      await writeDb(db);
      await deliverPush(db, userId, notification);
      // The gross: the gas fee was taken from the balance when the request was
      // opened, so the release credits the full gross on top of it.
      return NextResponse.json({ ok: true, balance, released: payout.gross });
    }

    if (action === 'request') {
      const payout = createRequest(db, {
        collection: MINING_PAYOUTS,
        idPrefix: 'MW',
        userId,
        items: buildMining(db, userId).filter((m) => m.withdrawable),
        grossOf: (m) => m.totalReturn,
      });
      await writeDb(db);
      // Approval is what releases the user's code, so a request nobody reviews
      // is a payout the user cannot collect. This is the queue growing.
      await deliverAdminPush(db, {
        title: 'Mining payout awaiting approval',
        body: `${session.profile.name} requested ${fmtUsd(payout.gross)} across ${payout.itemIds.length} contract${payout.itemIds.length === 1 ? '' : 's'}.`,
      });
      return NextResponse.json({ ok: true, request: redact(payout) });
    }

    return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
  } catch (err) {
    if (err instanceof PayoutError) {
      // A wrong code is written back so the attempt counter survives the
      // rejection — the happy path is the only one that skips this write.
      if (action === 'confirm') await writeDb(db);
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
