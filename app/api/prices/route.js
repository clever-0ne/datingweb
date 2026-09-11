import { NextResponse } from 'next/server';
import { MARKET_COINS } from '@/lib/market';

/**
 * GET /api/prices — live USD spot prices for the tickers.
 *
 * Fetched server-side and cached for 60s so that (a) the browser never hits the
 * price API directly, which keeps us inside CoinGecko's anonymous rate limit no
 * matter how many visitors are on the page, and (b) an outage upstream degrades
 * to the last known good values instead of an empty ticker.
 *
 * CoinGecko's free tier needs no API key. If it ever rate-limits us the response
 * is still 200 — with `live: false` and the fallback prices — because a stale
 * price is better than a broken dashboard.
 */
export const revalidate = 60;

const ENDPOINT = 'https://api.coingecko.com/api/v3/simple/price';

async function fetchLive() {
  const ids = MARKET_COINS.map((c) => c.id).join(',');
  const url = `${ENDPOINT}?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;
  try {
    const res = await fetch(url, {
      headers: { accept: 'application/json' },
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data && typeof data === 'object' ? data : null;
  } catch {
    // Network failure, DNS, timeout — fall through to the fallbacks.
    return null;
  }
}

export async function GET() {
  const live = await fetchLive();

  const coins = MARKET_COINS.map((c) => {
    const quote = live?.[c.id];
    const hasLive = quote && Number.isFinite(Number(quote.usd));
    const price = hasLive ? Number(quote.usd) : c.fallback;
    const change = Number.isFinite(Number(quote?.usd_24h_change)) ? Number(quote.usd_24h_change) : 0;
    return {
      id: c.id,
      name: c.name,
      sym: c.sym,
      img: c.img,
      price,
      change,
      up: change >= 0,
      live: !!hasLive,
    };
  });

  return NextResponse.json({
    ok: true,
    live: coins.some((c) => c.live),
    at: new Date().toISOString(),
    coins,
  });
}
