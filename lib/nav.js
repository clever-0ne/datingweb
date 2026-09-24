import { isConsoleRoute } from './console';

export const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { href: '/deposit', label: 'Deposit', icon: 'ArrowDownToLine' },
  { href: '/withdraw', label: 'Withdraw', icon: 'ArrowUpFromLine' },
  { href: '/transactions', label: 'Transactions', icon: 'Receipt' },
  { href: '/invest', label: 'Investments', icon: 'TrendingUp' },
  { href: '/invest-dashboard', label: 'Investment Dashboard', icon: 'BarChart3' },
  { href: '/inventory', label: 'Inventory', icon: 'Car' },
  { href: '/cloud-mining', label: 'Cloud Mining', icon: 'Bitcoin' },
  { href: '/my-miners', label: 'My Miners', icon: 'Cpu' },
  { href: '/account', label: 'Account', icon: 'User' },
];

/**
 * Routes that render without the signed-in app shell: the marketing pages
 * (which carry their own Conult-theme chrome) and the auth screens.
 *
 * Shared by AppChrome, which skips the shell here, and WalletProvider, which
 * skips its /api/wallet fetch — a signed-out visitor reading /about has no
 * wallet, so that request would be a database round trip for a 401.
 */
export const PUBLIC_ROUTES = ['/', '/about', '/faq', '/contact', '/terms', '/login', '/register', '/forgot-password', '/reset-password'];

export function isPublicRoute(pathname) {
  return PUBLIC_ROUTES.includes(pathname) || isConsoleRoute(pathname);
}

export const BOTTOM_NAV = [
  { href: '/dashboard', label: 'Home', icon: 'LayoutDashboard' },
  { href: '/invest', label: 'Invest', icon: 'TrendingUp' },
  { href: '/inventory', label: 'Inventory', icon: 'Car' },
  { href: '/cloud-mining', label: 'Mining', icon: 'Bitcoin' },
  { href: '/account', label: 'Account', icon: 'User' },
];
