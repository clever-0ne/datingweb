/** Site-wide copy used by the footer, the header and the contact page. */
export const SITE = {
  name: 'Tesla Capital',
  address: 'Tesla Capital, 40 Bank Street, Canary Wharf, London E14 5NR',
  phone: 'VIP-MEMBERS-ONLY',
  email: 'support@teslacapital.io',
};

/** Crypto marks in the "Contact One" grid, in the Archive 2 order. */
export const BRANDS = [
  ['usdc', 'usdt', 'ltc'],
  ['btc', 'dash', 'bch'],
  ['eth', 'doge', 'trx'],
];

/**
 * Cloud-mining contract tiers. `price` is the amount debited on purchase,
 * `totalReturn` is the full payout at maturity, `days` the term, and `hashrate`
 * the slice of the hosting farm the contract buys.
 *
 * Every tier runs the same 3-day term and pays 3× the amount invested, so what
 * separates them is the hashrate (and the size of the stake) rather than how
 * long the money is tied up. Contracts bought before the terms were unified
 * keep the `days` and `expiresAt` stored on the row, so shortening the tiers
 * does not retroactively mature anyone's existing contract.
 */
export const MINING_TERM_DAYS = 3;

export const MINING_TIERS = [
  { id: 'm1', name: 'Starter Miner', price: 1200, totalReturn: 3600, days: MINING_TERM_DAYS, hashrate: 120 },
  { id: 'm2', name: 'Silver Miner', price: 2500, totalReturn: 7500, days: MINING_TERM_DAYS, hashrate: 250 },
  { id: 'm3', name: 'Gold Miner', price: 5000, totalReturn: 15000, days: MINING_TERM_DAYS, hashrate: 500 },
  { id: 'm4', name: 'Platinum Miner', price: 10000, totalReturn: 30000, days: MINING_TERM_DAYS, hashrate: 1000 },
  { id: 'm5', name: 'Diamond Miner', price: 20000, totalReturn: 60000, days: MINING_TERM_DAYS, hashrate: 2000 },
];

/** The unit every tier's hashrate is quoted in. */
export const HASHRATE_UNIT = 'TH/s';

/** Daily profit earned by a mining tier (payout minus cost, split per day). */
export function miningDaily(tier) {
  return (tier.totalReturn - tier.price) / tier.days;
}

/**
 * How much of a contract's total return has accrued by `at`.
 *
 * A hosted contract earns steadily across its term and settles all at once when
 * the term ends, so this is the contract's progress through its term applied to
 * the full return — the number the mining page counts up. It is a display
 * figure only: nothing is credited to a balance until the term ends and the
 * payout is confirmed, so a contract that is 90% accrued is still worth exactly
 * zero in the account.
 *
 * Clamped at both ends so a clock skew or a contract bought in the future can
 * never show more than the full return or a negative figure.
 */
export function miningAccrued(contract, at = Date.now()) {
  const total = Number(contract?.totalReturn) || 0;
  const start = new Date(contract?.createdAt).getTime();
  const end = new Date(contract?.expiresAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return total;

  const progress = (at - start) / (end - start);
  return Math.max(0, Math.min(1, progress)) * total;
}

/**
 * Gas fee charged when a matured contract or plan is cashed out to the main
 * balance, as a percentage of the payout.
 *
 * It is charged against the user's OWN funds — debited from their balance the
 * moment a withdrawal request is opened, before any admin sees it. The user is
 * never asked to send a payment to receive their own money; there is no
 * transfer step and no address to pay to.
 *
 * Two consequences follow from charging it up front, both handled in
 * lib/payout.js: a user whose balance cannot cover the fee cannot open a
 * request at all, and a declined request refunds the fee rather than keeping
 * it — otherwise a rejection would quietly cost the user money. The balance is
 * checked before the debit, so it can never go negative.
 *
 * Shared by mining and investment payouts; they use the same format.
 */
export const WITHDRAWAL_FEE_PCT = 20;

/** Kept for existing call sites — same number, mining-specific name. */
export const MINING_WITHDRAWAL_FEE_PCT = WITHDRAWAL_FEE_PCT;

/**
 * A "boost" adds money to an already-running mining contract or investment and
 * raises its payout by this multiple of the amount added — the same 3× every
 * product already pays, so a boost reads as "buy more of the same position"
 * rather than a different rate. A boost never extends the term; it only raises
 * the payout that is already on schedule to mature.
 */
export const BOOST_MULTIPLIER = 3;

/** Bonus credited to a referrer when someone signs up with their link. */
export const REFERRAL_BONUS = 50;

/**
 * Wrong verification codes allowed before a payout request locks and needs an
 * admin to reissue it. Lives in this dependency-free module so both the server
 * rules (lib/payout.js) and the client UI can read the same number.
 */
export const MAX_CODE_ATTEMPTS = 5;

/**
 * Investment plans, $5,000 → $1,000,000. Every tier pays the same 3× multiple
 * of principal (a 200% ROI) over a 3-day term — the entry amount is what
 * separates them. The 3× matches the mining tiers, so the two products no
 * longer advertise different multiples for the same holding period.
 */
export const INVESTMENT_PLANS = [
  { id: 'p1', name: 'Bronze', amount: 5000, roi: 200, termDays: 3 },
  { id: 'p2', name: 'Silver', amount: 10000, roi: 200, termDays: 3 },
  { id: 'p3', name: 'Gold', amount: 25000, roi: 200, termDays: 3 },
  { id: 'p4', name: 'Platinum', amount: 50000, roi: 200, termDays: 3 },
  { id: 'p5', name: 'Diamond', amount: 100000, roi: 200, termDays: 3 },
  { id: 'p6', name: 'Elite', amount: 250000, roi: 200, termDays: 3 },
  { id: 'p7', name: 'Institutional', amount: 500000, roi: 200, termDays: 3 },
  { id: 'p8', name: 'Whale', amount: 1000000, roi: 200, termDays: 3 },
];

/** Total value of a plan at maturity: principal grown by its ROI. */
export function planReturn(plan) {
  return Math.round(plan.amount * (1 + plan.roi / 100) * 100) / 100;
}

/**
 * The landing page's counter row, derived from INVESTMENT_PLANS rather than
 * kept as its own list. It used to be a separate hardcoded array advertising
 * "2.5% daily for 7 days" — figures that no longer matched any plan a user
 * could actually buy. Deriving them means the marketing copy cannot drift from
 * the plans again.
 */
export const PLANS = INVESTMENT_PLANS.slice(0, 4).map((p) => ({
  id: p.id,
  name: `${p.name} Plan`,
  percent: p.roi,
  note: `Total return over ${p.termDays} days`,
}));
