import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { BOOST_MULTIPLIER } from '@/lib/plans';
import { miningStatus } from '@/lib/account';
import { round2, fmtUsd } from '@/lib/format';
import { pushNotification } from '@/lib/notifications';
import { deliverPush } from '@/lib/push';

/**
 * POST /api/mining/boost — add money to a running mining contract to raise its
 * payout. The boost is debited from the user's main balance immediately, and
 * the contract's total return rises by BOOST_MULTIPLIER × the boost (the same
 * 3× the contract already pays). The term does not change — only the payout.
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

  const contract = (db.mining || []).find((m) => m.id === id && m.userId === user.id);
  if (!contract) return NextResponse.json({ error: 'Contract not found.' }, { status: 404 });

  // Boosts only make sense while the contract is still earning. A matured
  // contract is already payable, so letting it be boosted would be an instant
  // "deposit now, withdraw 3× immediately" loop.
  if (miningStatus(contract) !== 'active') {
    return NextResponse.json(
      { error: 'This contract has already matured — boosts apply to running contracts only.' },
      { status: 400 },
    );
  }

  const boost = round2(amount);
  if (Number(user.balance) < boost) {
    return NextResponse.json({ error: 'Insufficient balance for this boost.' }, { status: 400 });
  }

  user.balance = round2(Number(user.balance) - boost);
  const added = round2(boost * BOOST_MULTIPLIER);
  contract.price = round2(Number(contract.price) + boost);
  contract.totalReturn = round2(Number(contract.totalReturn) + added);
  // Keep the displayed daily profit consistent with the new price/return.
  contract.dailyEarnings = round2((Number(contract.totalReturn) - Number(contract.price)) / (Number(contract.days) || 1));

  db.boosts = db.boosts || [];
  db.boosts.push({
    id: `B-${Date.now()}`,
    userId: user.id,
    kind: 'mining',
    itemId: contract.id,
    itemLabel: contract.tierName,
    amount: boost,
    createdAt: new Date().toISOString(),
  });

  const notification = pushNotification(db, user.id, {
    title: 'Mining contract boosted',
    body: `${contract.tierName} boosted by ${fmtUsd(boost)} — payout raised by ${fmtUsd(added)} to ${fmtUsd(contract.totalReturn)}.`,
    kind: 'success',
  });

  await writeDb(db);
  await deliverPush(db, user.id, notification);

  return NextResponse.json({ ok: true, balance: user.balance, totalReturn: contract.totalReturn, added });
}
