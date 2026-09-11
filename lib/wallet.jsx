'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { syncClock } from './clock';
import { isPublicRoute } from './nav';

/**
 * Server-backed wallet. Balance, transactions, mining contracts and
 * investments all live in `data/db.json` keyed to the signed-in user, so every
 * account is isolated and new accounts start at $0.00. This replaces the old
 * localStorage wallet, which held a single fake balance shared by everyone.
 */

const WalletContext = createContext(null);

export function fmtMoney(n) {
  return '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const EMPTY = {
  balance: 0,
  transactions: [],
  mining: [],
  investments: [],
  miningWithdrawals: [],
  investmentWithdrawals: [],
  notifications: [],
  portfolio: {
    activeCapital: 0,
    totalReturns: 0,
    realizedGains: 0,
    activeContracts: 0,
    monthlyYield: 0,
    miningCount: 0,
    investmentCount: 0,
  },
  // Investments only — /invest-dashboard shows no mining, so it reads this
  // rather than `portfolio`, whose figures include mining contract rows.
  investmentPortfolio: {
    activeCapital: 0,
    totalReturns: 0,
    realizedGains: 0,
    activeContracts: 0,
    monthlyYield: 0,
    miningCount: 0,
    investmentCount: 0,
  },
  totalDeposited: 0,
  totalWithdrawn: 0,
};

export function WalletProvider({ children }) {
  const [state, setState] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  // The signed-in answer rides along with the wallet rather than being fetched
  // separately, so the shell renders after one request instead of two.
  // null = still unknown, true/false = answered.
  const [authed, setAuthed] = useState(null);
  const [user, setUser] = useState(null);

  const pathname = usePathname();
  const isPublic = isPublicRoute(pathname);

  const refresh = useCallback(async () => {
    // A marketing page has no wallet behind it, and /api/wallet would answer
    // 401 only after a database round trip. Skip it entirely.
    if (isPublic) {
      setLoading(false);
      return;
    }
    try {
      const r = await fetch('/api/wallet');
      const d = await r.json();
      if (r.status === 401 || !d.ok) {
        setAuthed(false);
        setUser(null);
      }
      if (d.ok) {
        setAuthed(true);
        setUser(d.user ?? null);
        // Re-anchor the display clock to the server's before anything renders
        // a duration from it.
        syncClock(d.serverNow);
        setState({
          balance: d.balance ?? 0,
          transactions: d.transactions ?? [],
          mining: d.mining ?? [],
          investments: d.investments ?? [],
          miningWithdrawals: d.miningWithdrawals ?? [],
          investmentWithdrawals: d.investmentWithdrawals ?? [],
          notifications: d.notifications ?? [],
          portfolio: d.portfolio ?? EMPTY.portfolio,
          investmentPortfolio: d.investmentPortfolio ?? EMPTY.investmentPortfolio,
          totalDeposited: d.totalDeposited ?? 0,
          totalWithdrawn: d.totalWithdrawn ?? 0,
        });
      }
    } catch (e) {
      // Leave the last known state on a network error, but do answer the auth
      // question: a null here would leave the shell on its skeleton forever.
      setAuthed(false);
    } finally {
      setLoading(false);
    }
  }, [isPublic]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Poll so changes made elsewhere — an admin approving a payout, a deposit
  // landing on another device — reflect on this page without a manual reload.
  // The mining counters are ref-driven and never re-render, so a re-fetch costs
  // only the one request, and it also re-anchors the display clock each tick.
  useEffect(() => {
    if (isPublic || !authed) return;
    // 15s, and only while the tab is visible — a hidden tab costs a DB hit every
    // tick and nobody is looking at it.
    let id = setInterval(() => refresh(), 15000);
    const onVis = () => {
      clearInterval(id);
      if (!document.hidden) id = setInterval(() => refresh(), 15000);
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [isPublic, authed, refresh]);

  // Fire-and-re-query helper shared by all mutations.
  const post = useCallback(
    async (url, body) => {
      try {
        const r = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body || {}),
        });
        const d = await r.json();
        await refresh();
        return d;
      } catch (e) {
        return { ok: false, error: 'Network error. Please try again.' };
      }
    },
    [refresh],
  );

  // Some older checkout components still call these with the pre-server
  // signature `deposit(amount, type, sub)` / `withdraw(amount, type, sub)`.
  // Resolve a coin id from the second arg, defaulting to btc when the caller
  // passes a label rather than a coin code.
  const resolveCoin = (arg) => {
    const s = String(arg || '').toLowerCase();
    return ['btc', 'eth', 'usdt', 'sol'].includes(s) ? s : 'btc';
  };

  const deposit = useCallback(
    (amount, coinOrType) => post('/api/deposits', { amount, coin: resolveCoin(coinOrType) }),
    [post],
  );
  const withdraw = useCallback(
    (amount, coinOrType, address) =>
      post('/api/withdrawals', { amount, coin: resolveCoin(coinOrType), address: address || '' }),
    [post],
  );
  // `opts.ref` carries the stock slug so the order can be traced back to the
  // item; the response includes the order, whose receiptId the caller links to.
  const purchase = useCallback(
    (amount, type = 'Purchase', item = 'Order', opts = {}) =>
      post('/api/purchase', { amount, type, item, ref: opts.ref || '' }),
    [post],
  );
  const buyMining = useCallback((tierId) => post('/api/mining', { tierId }), [post]);
  const buyInvestment = useCallback((planId) => post('/api/invest', { planId }), [post]);

  // Boost a running position: add money from the balance to raise its payout.
  // Same shape as a purchase — a plain POST that re-queries the wallet.
  const boostMining = useCallback((id, amount) => post('/api/mining/boost', { id, amount }), [post]);
  const boostInvestment = useCallback((id, amount) => post('/api/invest/boost', { id, amount }), [post]);

  // Payouts: open a request over everything matured, then release it with the
  // code an admin's approval put in the user's notifications. Mining and
  // investments use the same format — only the endpoint differs.
  const requestMiningWithdrawal = useCallback(
    () => post('/api/mining/withdraw', { action: 'request' }),
    [post],
  );
  const confirmMiningWithdrawal = useCallback(
    (id, code) => post('/api/mining/withdraw', { action: 'confirm', id, code }),
    [post],
  );
  const requestInvestmentWithdrawal = useCallback(
    () => post('/api/invest/withdraw', { action: 'request' }),
    [post],
  );
  const confirmInvestmentWithdrawal = useCallback(
    (id, code) => post('/api/invest/withdraw', { action: 'confirm', id, code }),
    [post],
  );
  const markNotificationsRead = useCallback((id) => post('/api/notifications', { id }), [post]);

  const value = {
    ...state,
    loading,
    authed,
    user,
    refresh,
    deposit,
    withdraw,
    purchase,
    buyMining,
    buyInvestment,
    boostMining,
    boostInvestment,
    requestMiningWithdrawal,
    confirmMiningWithdrawal,
    requestInvestmentWithdrawal,
    confirmInvestmentWithdrawal,
    markNotificationsRead,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}
