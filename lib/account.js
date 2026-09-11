/** Server-side wallet projection. Turns raw db rows for one user into the
 *  shapes the client renders: transaction list, mining contracts with a live
 *  status, investments, mining payout requests, and two portfolio summaries —
 *  combined (mining + investments) for /dashboard, and investments-only for
 *  /invest-dashboard. */

import { MAX_CODE_ATTEMPTS } from './plans';

export function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const COIN_LABEL = {
  btc: 'BTC · Bitcoin network',
  eth: 'ETH · ERC-20',
  usdt: 'USDT · TRC-20',
  sol: 'SOL · Solana',
};

export function miningStatus(m) {
  return Date.now() >= new Date(m.expiresAt).getTime() ? 'completed' : 'active';
}

export function investmentStatus(i) {
  return Date.now() >= new Date(i.maturesAt).getTime() ? 'completed' : 'active';
}

/**
 * Item ids already claimed by a payout request against `collection`. An item is
 * claimed for as long as its request might still pay out — pending, approved,
 * or already released — so it can never be cashed twice. Rejecting a request
 * frees its items again.
 *
 * Shared by mining contracts and investment plans, which use the same format.
 */
function claimedIds(db, collection, userId) {
  const ids = new Set();
  for (const w of db[collection] || []) {
    if (w.userId !== userId || w.status === 'rejected') continue;
    for (const id of w.itemIds || []) ids.add(id);
  }
  return ids;
}

export function buildMining(db, userId) {
  const claimed = claimedIds(db, 'miningWithdrawals', userId);
  return (db.mining || [])
    .filter((m) => m.userId === userId)
    .map((m) => ({
      id: m.id,
      tierName: m.tierName,
      price: Number(m.price),
      totalReturn: Number(m.totalReturn),
      dailyEarnings: Number(m.dailyEarnings),
      days: m.days,
      // Absent on contracts bought before hashrate was part of a tier, so the
      // card treats a missing value as "do not show this line".
      hashrate: m.hashrate ?? null,
      createdAt: m.createdAt,
      expiresAt: m.expiresAt,
      status: miningStatus(m),
      // Matured, and not already committed to a payout request.
      withdrawable: miningStatus(m) === 'completed' && !claimed.has(m.id),
    }));
}

/**
 * Payout requests for one user, newest first. The six-digit code is
 * deliberately absent: it reaches the user through their notification on
 * approval, never through this payload.
 */
function buildPayouts(db, collection, userId, itemLabel) {
  return (db[collection] || [])
    .filter((w) => w.userId === userId)
    .map((w) => ({
      id: w.id,
      userId: w.userId,
      [itemLabel]: (w.itemIds || []).length,
      gross: round2(w.gross),
      fee: round2(w.fee),
      net: round2(w.net),
      status: w.status,
      attemptsLeft: Math.max(0, MAX_CODE_ATTEMPTS - (Number(w.attempts) || 0)),
      createdAt: w.createdAt,
      approvedAt: w.approvedAt || null,
      releasedAt: w.releasedAt || null,
      rejectReason: w.rejectReason || null,
      // The gas fee is taken when the request opens, so the card can say
      // whether it is currently held, and show a refund if one was made.
      feeChargedAt: w.feeChargedAt || null,
      feeRefundedAt: w.feeRefundedAt || null,
    }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function buildMiningWithdrawals(db, userId) {
  return buildPayouts(db, 'miningWithdrawals', userId, 'contracts');
}

export function buildInvestmentWithdrawals(db, userId) {
  return buildPayouts(db, 'investmentWithdrawals', userId, 'plans');
}

export function buildInvestments(db, userId) {
  const claimed = claimedIds(db, 'investmentWithdrawals', userId);
  return (db.investments || [])
    .filter((i) => i.userId === userId)
    .map((i) => ({
      id: i.id,
      planName: i.planName,
      amount: Number(i.amount),
      roi: Number(i.roi),
      termDays: i.termDays,
      returnAmount: Number(i.returnAmount),
      createdAt: i.createdAt,
      maturesAt: i.maturesAt,
      status: investmentStatus(i),
      // Matured, and not already committed to a payout request.
      withdrawable: investmentStatus(i) === 'completed' && !claimed.has(i.id),
    }));
}

export function buildTransactions(db, userId) {
  const txns = [];

  for (const d of (db.deposits || []).filter((x) => x.userId === userId)) {
    txns.push({
      id: d.id,
      ts: new Date(d.createdAt).getTime(),
      date: fmtDate(d.createdAt),
      type: 'Deposit',
      sub: COIN_LABEL[d.coin] || 'Crypto deposit',
      amount: Number(d.amount),
      kind: 'credit',
      icon: 'arrow-down',
      status: d.status,
    });
  }
  for (const w of (db.withdrawals || []).filter((x) => x.userId === userId)) {
    txns.push({
      id: w.id,
      ts: new Date(w.createdAt).getTime(),
      date: fmtDate(w.createdAt),
      type: 'Withdrawal',
      sub: COIN_LABEL[w.coin] || 'Crypto withdrawal',
      amount: -Number(w.amount),
      kind: 'debit',
      icon: 'arrow-up',
      status: w.status,
    });
  }
  for (const m of (db.mining || []).filter((x) => x.userId === userId)) {
    txns.push({
      id: m.id,
      ts: new Date(m.createdAt).getTime(),
      date: fmtDate(m.createdAt),
      type: 'Mining Contract',
      sub: m.tierName,
      amount: -Number(m.price),
      kind: 'debit',
      icon: 'cpu',
      status: 'approved',
    });
  }
  for (const i of (db.investments || []).filter((x) => x.userId === userId)) {
    txns.push({
      id: i.id,
      ts: new Date(i.createdAt).getTime(),
      date: fmtDate(i.createdAt),
      type: 'Investment',
      sub: i.planName,
      amount: -Number(i.amount),
      kind: 'debit',
      icon: 'briefcase',
      status: 'approved',
    });
  }
  // Inventory orders — cars and other stock. These were previously recorded in
  // db.orders but never surfaced here, so a purchase vanished from the ledger.
  for (const o of (db.orders || []).filter((x) => x.userId === userId)) {
    txns.push({
      id: o.id,
      ts: new Date(o.createdAt).getTime(),
      date: fmtDate(o.createdAt),
      type: o.type || 'Purchase',
      sub: o.item,
      amount: -Number(o.amount),
      kind: 'debit',
      icon: 'shopping-bag',
      status: 'approved',
      receiptId: o.receiptId || null,
      ref: o.ref || null,
    });
  }
  // Payouts. Each one can contribute up to three ledger lines, because the gas
  // fee and the payout itself now move at different moments: the fee is debited
  // when the request is opened, refunded if the request is declined, and the
  // full gross is credited when the user confirms the release.
  const PAYOUT_STREAMS = [
    { collection: 'miningWithdrawals', label: 'Mining', item: 'contract', icon: 'cpu' },
    { collection: 'investmentWithdrawals', label: 'Investment', item: 'plan', icon: 'briefcase' },
  ];

  for (const stream of PAYOUT_STREAMS) {
    for (const w of (db[stream.collection] || []).filter((x) => x.userId === userId)) {
      const items = (w.itemIds || []).length;
      const fee = round2(w.fee);

      if (w.feeChargedAt && Number(w.fee) > 0) {
        txns.push({
          id: `${w.id}-fee`,
          ts: new Date(w.feeChargedAt).getTime(),
          date: fmtDate(w.feeChargedAt),
          type: 'Gas Fee',
          sub: `${stream.label} withdrawal ${w.id} · ${items} ${stream.item}(s)`,
          amount: -fee,
          kind: 'debit',
          icon: 'fuel',
          status: 'approved',
        });
      }

      if (w.feeRefundedAt) {
        txns.push({
          id: `${w.id}-fee-refund`,
          ts: new Date(w.feeRefundedAt).getTime(),
          date: fmtDate(w.feeRefundedAt),
          type: 'Gas Fee Refund',
          sub: `${stream.label} withdrawal ${w.id} declined`,
          amount: fee,
          kind: 'credit',
          icon: 'fuel',
          status: 'approved',
        });
      }

      if (w.status === 'released') {
        txns.push({
          id: w.id,
          ts: new Date(w.releasedAt || w.createdAt).getTime(),
          date: fmtDate(w.releasedAt || w.createdAt),
          type: `${stream.label} Payout`,
          sub: `${items} ${stream.item}(s) · fee already charged`,
          amount: Number(w.gross),
          kind: 'credit',
          icon: stream.icon,
          status: 'approved',
        });
      }
    }
  }

  // Boosts — money added to a running mining contract or investment to raise
  // its payout. A separate collection so the ledger can tell a boost apart from
  // the original purchase, and from the gas-fee lines above.
  for (const b of (db.boosts || []).filter((x) => x.userId === userId)) {
    txns.push({
      id: b.id,
      ts: new Date(b.createdAt).getTime(),
      date: fmtDate(b.createdAt),
      type: b.kind === 'mining' ? 'Mining Boost' : 'Investment Boost',
      sub: b.itemLabel,
      amount: -Number(b.amount),
      kind: 'debit',
      icon: 'trending-up',
      status: 'approved',
    });
  }

  return txns.sort((a, b) => b.ts - a.ts);
}

/** Shared summary maths. Takes the two row sets already filtered to one user,
 *  so the combined and investment-only views cannot drift apart. */
function summarize(mining, inv) {
  const activeMining = mining.filter((m) => miningStatus(m) === 'active');
  const activeInv = inv.filter((i) => investmentStatus(i) === 'active');
  const doneMining = mining.filter((m) => miningStatus(m) === 'completed');
  const doneInv = inv.filter((i) => investmentStatus(i) === 'completed');

  const activeCapital =
    activeMining.reduce((s, m) => s + Number(m.price), 0) +
    activeInv.reduce((s, i) => s + Number(i.amount), 0);

  const totalReturns =
    mining.reduce((s, m) => s + (Number(m.totalReturn) - Number(m.price)), 0) +
    inv.reduce((s, i) => s + (Number(i.returnAmount) - Number(i.amount)), 0);

  const realizedGains =
    doneMining.reduce((s, m) => s + (Number(m.totalReturn) - Number(m.price)), 0) +
    doneInv.reduce((s, i) => s + (Number(i.returnAmount) - Number(i.amount)), 0);

  const monthlyYield =
    activeMining.reduce((s, m) => s + Number(m.dailyEarnings) * 30, 0) +
    activeInv.reduce((s, i) => s + (Number(i.returnAmount) - Number(i.amount)), 0);

  return {
    activeCapital: round2(activeCapital),
    totalReturns: round2(totalReturns),
    realizedGains: round2(realizedGains),
    monthlyYield: round2(monthlyYield),
    activeContracts: activeMining.length + activeInv.length,
    miningCount: mining.length,
    investmentCount: inv.length,
  };
}

/** Combined mining + investment summary. Used by /dashboard, which shows both. */
export function buildPortfolio(db, userId) {
  return summarize(
    (db.mining || []).filter((x) => x.userId === userId),
    (db.investments || []).filter((x) => x.userId === userId),
  );
}

/** Investments only. The invest dashboard shows no mining, so its headline
 *  figures must not include mining rows — see app/invest-dashboard/page.jsx. */
export function buildInvestmentPortfolio(db, userId) {
  return summarize([], (db.investments || []).filter((x) => x.userId === userId));
}

export function totals(db, userId) {
  const totalDeposited = (db.deposits || [])
    .filter((x) => x.userId === userId && x.status === 'approved')
    .reduce((s, x) => s + Number(x.amount), 0);
  const totalWithdrawn = (db.withdrawals || [])
    .filter((x) => x.userId === userId && x.status === 'approved')
    .reduce((s, x) => s + Number(x.amount), 0);
  return { totalDeposited: round2(totalDeposited), totalWithdrawn: round2(totalWithdrawn) };
}
