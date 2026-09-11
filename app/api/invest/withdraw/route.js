import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { buildInvestments } from '@/lib/account';
import {
  INVESTMENT_PAYOUTS, PayoutError, createRequest, confirmRequest, redact,
} from '@/lib/payout';
import { deliverPush } from '@/lib/push';

/**
 * POST /api/invest/withdraw — the two-step investment payout.
 *
 *   { action: 'request' }             claim every matured plan
 *   { action: 'confirm', id, code }   release an admin-approved request
 *
 * Identical in shape to the mining payout — same fee, same code flow, same
 * "nothing moves until confirm" guarantee. Both are served by lib/payout.js.
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
        collection: INVESTMENT_PAYOUTS,
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
        collection: INVESTMENT_PAYOUTS,
        idPrefix: 'IW',
        userId,
        items: buildInvestments(db, userId).filter((i) => i.withdrawable),
        grossOf: (i) => i.returnAmount,
      });
      await writeDb(db);
      return NextResponse.json({ ok: true, request: redact(payout) });
    }

    return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
  } catch (err) {
    if (err instanceof PayoutError) {
      if (action === 'confirm') await writeDb(db);
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
