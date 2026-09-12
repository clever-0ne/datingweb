/**
 * Static fallback list — used for the first paint and for the coin selector's
 * labels/icons. The addresses are deliberately empty: the only deposit address
 * a user may ever be shown is the one the admin has set in the console (see
 * /api/coins and lib/useCoins.js). Never put a literal address back in here.
 */
export const COINS = [
  { id: 'btc', name: 'Bitcoin', symbol: 'BTC', network: 'BTC network', icon: '/assets/coins/btc.png', rate: 95000, address: '' },
  { id: 'eth', name: 'Ethereum', symbol: 'ETH', network: 'ERC-20', icon: '/assets/coins/eth.png', rate: 3500, address: '' },
  { id: 'usdt', name: 'Tether', symbol: 'USDT', network: 'TRC-20', icon: '/assets/coins/usdt.png', rate: 1, address: '' },
  { id: 'sol', name: 'Solana', symbol: 'SOL', network: 'Solana', icon: '/assets/coins/sol.png', rate: 155, address: '' },
];

/**
 * There is deliberately no findCoin() here. Looking a coin up straight from
 * this list would hand back one of the address-less entries above and silently
 * show a blank deposit address. Use useCoins()/pickCoin() from lib/useCoins.js,
 * which read what the admin actually configured.
 */

export function fmt(n) {
  return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
