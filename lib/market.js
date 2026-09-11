/**
 * Market metadata for the tickers shown around the site.
 *
 * Prices here are FALLBACKS ONLY — the last-resort values used when the price
 * feed is unreachable. Live values come from /api/prices, which caches the
 * upstream response so the browser never talks to the price API directly.
 *
 * Dependency-free on purpose: client components import this.
 */

export const MARKET_COINS = [
  { id: 'bitcoin', name: 'Bitcoin', sym: 'BTC', img: '/assets/coins/btc.png', fallback: 95000 },
  { id: 'ethereum', name: 'Ethereum', sym: 'ETH', img: '/assets/coins/eth.png', fallback: 3500 },
  { id: 'solana', name: 'Solana', sym: 'SOL', img: '/assets/coins/sol.png', fallback: 155 },
  { id: 'tether', name: 'Tether', sym: 'USDT', img: '/assets/coins/usdt.png', fallback: 1 },
  { id: 'dogecoin', name: 'Dogecoin', sym: 'DOGE', img: '/assets/coins/doge.svg', fallback: 0.18 },
  { id: 'ripple', name: 'Ripple', sym: 'XRP', img: '/assets/coins/xrp.svg', fallback: 0.65 },
  { id: 'algorand', name: 'Algorand', sym: 'ALGO', img: '/assets/coins/algo.svg', fallback: 0.21 },
];

/**
 * Format a price at a sensible precision. Sub-dollar coins need more decimals
 * than Bitcoin does — "$0.18" and "$0.1824" are very different numbers to a
 * trader, so the digits scale with magnitude.
 */
export function fmtPrice(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '—';
  const digits = v >= 1000 ? 2 : v >= 1 ? 2 : v >= 0.01 ? 4 : 6;
  return '$' + v.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

/** "+1.06%" / "-2.41%" — always signed, so direction reads at a glance. */
export function fmtChange(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '—';
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
}
