'use client';

import { useEffect, useState } from 'react';
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
 * Until /api/coins answers, the static list renders so the page is not empty;
 * the live values replace it as soon as they arrive.
 */
export function useCoins() {
  const [coins, setCoins] = useState(COINS);

  useEffect(() => {
    let live = true;
    fetch('/api/coins')
      .then((r) => r.json())
      .then((d) => {
        if (live && d.ok && d.coins?.length) setCoins(d.coins);
      })
      .catch(() => {
        /* keep the static fallback — the address block renders blank, which is
           better than showing an address the admin did not set. */
      });
    return () => {
      live = false;
    };
  }, []);

  return coins;
}

/** Look a coin up by id, falling back to the first one so callers never get
 *  undefined while the live list is still loading. */
export function pickCoin(coins, id) {
  return coins.find((c) => c.id === id) || coins[0] || null;
}
