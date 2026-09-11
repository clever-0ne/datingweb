'use client';

import { useEffect, useState } from 'react';
import { MARKET_COINS } from './market';

/**
 * Live market prices, shared across every component that asks for them.
 *
 * Without the module-level cache each ticker on a page would fire its own
 * request; with it, the first component to mount starts one fetch and the rest
 * subscribe to the same result. A 60s poll keeps prices moving without the page
 * ever going quiet, and matches the server's revalidate window so we mostly read
 * from the cached upstream rather than hammering CoinGecko.
 */

const REFRESH_MS = 60_000;

let cache = null; // last successful payload
let inflight = null; // dedupes concurrent callers
const subscribers = new Set();

function emit(payload) {
  cache = payload;
  for (const fn of subscribers) fn(payload);
}

async function load() {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const res = await fetch('/api/prices');
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

/** Fallback shape so a ticker can render before the first fetch lands. */
function offlinePayload() {
  return {
    ok: true,
    live: false,
    at: null,
    coins: MARKET_COINS.map((c) => ({
      id: c.id, name: c.name, sym: c.sym, img: c.img,
      price: c.fallback, change: 0, up: true, live: false,
    })),
  };
}

export function usePrices() {
  const [data, setData] = useState(() => cache || offlinePayload());

  useEffect(() => {
    let alive = true;
    const onUpdate = (payload) => {
      if (alive && payload) setData(payload);
    };
    subscribers.add(onUpdate);

    // Someone else may have warmed the cache between render and effect.
    if (cache) setData(cache);
    else load().then(onUpdate);

    const timer = setInterval(() => load().then(onUpdate), REFRESH_MS);
    return () => {
      alive = false;
      subscribers.delete(onUpdate);
      clearInterval(timer);
    };
  }, []);

  return data;
}

/**
 * Prices keyed by uppercase symbol — the form the tickers already speak in.
 * Unknown symbols fall back to the static metadata so a newly added coin still
 * renders a name and icon rather than blank.
 */
export function usePriceMap() {
  const { coins } = usePrices();
  const map = {};
  for (const c of coins) map[c.sym.toUpperCase()] = c;
  for (const c of MARKET_COINS) {
    if (!map[c.sym.toUpperCase()]) {
      map[c.sym.toUpperCase()] = {
        id: c.id, name: c.name, sym: c.sym, img: c.img,
        price: c.fallback, change: 0, up: true, live: false,
      };
    }
  }
  return map;
}
