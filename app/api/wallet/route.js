import { NextResponse } from 'next/server';
import { readDb } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import {
  buildTransactions, buildMining, buildInvestments, buildPortfolio,
  buildInvestmentPortfolio, buildMiningWithdrawals, buildInvestmentWithdrawals,
  totals,
} from '@/lib/account';
import { buildNotifications } from '@/lib/notifications';
import { REFERRAL_BONUS } from '@/lib/plans';

// GET /api/wallet — everything the signed-in user's wallet renders: balance,
// transactions, mining contracts, investments, both payout queues,
// notifications, and both portfolio summaries. `portfolio` combines mining and
// investments (/dashboard); `investmentPortfolio` is investments-only
// (/invest-dashboard, which shows no mining). Notifications ride along here so
// the bell in AppChrome refreshes on every wallet mutation.
export async function GET(req) {
  const session = await currentUser(req);
  if (!session?.profile) {
    return NextResponse.json({ ok: false, error: 'Not signed in.' }, { status: 401 });
  }

  const db = await readDb();
  const userId = session.profile.id;
  const referralCount = (db.users || []).filter((u) => u.referredBy === userId).length;

  return NextResponse.json({
    ok: true,
    // Who is signed in, so the shell does not need a second request of its own
    // to find out. /api/auth/me still exists for anything that wants only this.
    user: {
      id: session.profile.id,
      name: session.profile.name,
      email: session.profile.email,
    },
    referralCode: userId,
    referralCount,
    referralBonus: referralCount * REFERRAL_BONUS,
    // The client anchors its countdowns to this rather than to the device
    // clock, so a phone with its date changed cannot show a contract as
    // matured while the server still considers it running.
    serverNow: Date.now(),
    balance: Number(session.profile.balance) || 0,
    transactions: buildTransactions(db, userId),
    mining: buildMining(db, userId),
    investments: buildInvestments(db, userId),
    miningWithdrawals: buildMiningWithdrawals(db, userId),
    investmentWithdrawals: buildInvestmentWithdrawals(db, userId),
    notifications: buildNotifications(db, userId),
    portfolio: buildPortfolio(db, userId),
    investmentPortfolio: buildInvestmentPortfolio(db, userId),
    ...totals(db, userId),
  });
}
