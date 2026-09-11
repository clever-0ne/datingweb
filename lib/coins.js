export const COINS = [
  { id: 'btc', name: 'Bitcoin', symbol: 'BTC', network: 'BTC network', icon: '/assets/coins/btc.png', rate: 95000, address: 'bc1qxtfxtrdepplaceholderaddress0001' },
  { id: 'eth', name: 'Ethereum', symbol: 'ETH', network: 'ERC-20', icon: '/assets/coins/eth.png', rate: 3500, address: '0x8F3Cf7ad23Cd3CaDbD9735AFf958023239c6A063' },
  { id: 'usdt', name: 'Tether', symbol: 'USDT', network: 'TRC-20', icon: '/assets/coins/usdt.png', rate: 1, address: 'TXTeamFXTradeDepositPlaceholderAddress001' },
  { id: 'sol', name: 'Solana', symbol: 'SOL', network: 'Solana', icon: '/assets/coins/sol.png', rate: 155, address: 'XTeamFXTradeSolanaDepositPlaceholderAddress0001' },
];

export function findCoin(id) {
  return COINS.find((c) => c.id === id) || COINS[0];
}

export function fmt(n) {
  return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
