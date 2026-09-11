import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { BOOST_MULTIPLIER } from '@/lib/plans';
import { investmentStatus } from '@/lib/account';
import { round2, fmtUsd } from '@/lib/format';
import { pushNotification } from '@/lib/notifications';
import { deliverPush } from '@/lib/push';

/**
 * POST /api/invest/boost — add money to a running investment plan to raise its
 * payout. The boost is debited from the user's main balance immediately, and
 * the plan's return rises by BOOST_MULTIPLIER × the boost (the same 3× the
 * plan already pays). The term does not change — only the payout.
 */
export async function POST(req) {
  const session = await currentUser(req);
  if (!session?.profile) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const id = String(body.id || '');
  const amount = Number(body.amount);

  if (!id || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: 'Enter a valid boost amount.' }, { status: 400 });
  }

  const db = await readDb();
  const user = (db.users || []).find((u) => u.id === session.profile.id);
  if (!user) return NextResponse.json({ error: 'Account not found.' }, { status: 401 });

  const investment = (db.investments || []).find((i) => i.id === id && i.userId === user.id);
  if (!investment) return NextResponse.json({ error: 'Plan not found.' }, { status: 404 });

  if (investmentStatus(investment) !== 'active') {
    return NextResponse.json(
      { error: 'This plan has already matured — boosts apply to running plans only.' },
      { status: 400 },
    );
  }

  const boost = round2(amount);
  if (Number(user.balance) < boost) {
    return NextResponse.json({ error: 'Insufficient balance for this boost.' }, { status: 400 });
  }

  user.balance = round2(Number(user.balance) - boost);
  const added = round2(boost * BOOST_MULTIPLIER);
  investment.amount = round2(Number(investment.amount) + boost);
  investment.returnAmount = round2(Number(investment.returnAmount) + added);

  db.boosts = db.boosts || [];
  db.boosts.push({
    id: `B-${Date.now()}`,
    userId: user.id,
    kind: 'investment',
    itemId: investment.id,
    itemLabel: investment.planName,
    amount: boost,
    createdAt: new Date().toISOString(),
  });

  const notification = pushNotification(db, user.id, {
    title: 'Investment plan boosted',
    body: `${investment.planName} boosted by ${fmtUsd(boost)} — payout raised by ${fmtUsd(added)} to ${fmtUsd(investment.returnAmount)}.`,
    kind: 'success',
  });

  await writeDb(db);
  await deliverPush(db, user.id, notification);

  return NextResponse.json({ ok: true, balance: user.balance, returnAmount: investment.returnAmount, added });
}
