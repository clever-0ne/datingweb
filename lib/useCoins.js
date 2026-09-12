'use client';

import { useCallback, useEffect, useState } from 'react';
import { COINS } from './coins';

/**
 * The deposit coins the admin has configured in the console.
 *
 * The static COINS list in lib/coins.js is only a first paint — it carries no
 * addresses (they are blank there on purpose) and can never be the source of
 * truth, because the admin edits addresses and rates at runtime. Every screen
 * that shows a deposit address or converts a USD amount must read through this
 * hook, or it will keep showing a stale address after the admin changes it.
 *
 * The admin's address is what the deposit page shows, and it stays there until
 * the admin replaces it. Re-fetching on tab focus is what makes that true for a
 * page that was already open when the change was saved: the user comes back to
 * the tab and sees the new address, with no hard reload.
 */
export function useCoins() {
  const [coins, setCoins] = useState(COINS);

  const load = useCallback(() => {
    // no-store: the browser must never answer this from its own cache, or a
    // saved address change is invisible until the cache happens to expire.
    fetch('/api/coins', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && d.coins?.length) setCoins(d.coins);
      })
      .catch(() => {
        /* keep what we have — blank addresses are better than an address the
           admin did not set. */
      });
  }, []);

  useEffect(() => {
    load();
    const onVisible = () => {
      if (document.visibilityState === 'visible') load();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [load]);

  return coins;
}

/** Look a coin up by id, falling back to the first one so callers never get
 *  undefined while the live list is still loading. */
export function pickCoin(coins, id) {
  return coins.find((c) => c.id === id) || coins[0] || null;
}
