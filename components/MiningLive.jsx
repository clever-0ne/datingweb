'use client';

import { useEffect, useRef } from 'react';
import { fmtMoney } from '@/lib/wallet';
import { miningAccrued } from '@/lib/plans';
import { now as serverNow } from '@/lib/clock';

/**
 * The live half of the mining design: the equalizer bars beside a "Mining"
 * label, and the figures that count up while a contract runs.
 *
 * PERFORMANCE — why these write to the DOM instead of using state.
 *
 * The first cut held the ticking value in useState and updated it from a
 * requestAnimationFrame loop. That re-rendered the component 60 times a second,
 * and with several active contracts on one page it reached hundreds of React
 * renders per second — enough to make the page visibly stutter.
 *
 * So there is no state here. One shared interval drives every counter, and each
 * one writes its already-formatted string straight to its own text node,
 * skipping React entirely. Nothing re-renders while the numbers move.
 *
 * The tick is 250ms, not a frame: these figures are money to the cent, so
 * anything faster is invisible work. Reading the clock on every tick (rather
 * than adding a fixed increment) means a tab that was backgrounded or throttled
 * catches up to the correct value instead of drifting behind it.
 */

const TICK_MS = 250;

/** One timer and one subscriber list for the whole page, whatever is on it. */
const subscribers = new Set();
let timer = null;

function subscribe(fn) {
  subscribers.add(fn);
  if (!timer) {
    timer = setInterval(() => {
      const at = serverNow();
      for (const s of subscribers) s(at);
    }, TICK_MS);
  }
  return () => {
    subscribers.delete(fn);
    if (!subscribers.size && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

/** Write only on a real change — assigning identical text still costs layout. */
function setText(el, next) {
  if (el && el.textContent !== next) el.textContent = next;
}

/** The three animated bars that make a contract look like it is working. */
export function MiningBars() {
  return (
    <div className="flex h-4 items-end gap-0.5" aria-hidden="true">
      <span className="eq-bar" />
      <span className="eq-bar" />
      <span className="eq-bar" />
    </div>
  );
}

/**
 * A contract's accrued return, counting up live.
 *
 * `contract` needs createdAt / expiresAt / totalReturn. Only mount this for an
 * active contract: a finished one's figure is final, and belongs in the static
 * rows rather than under a counter that implies it is still growing.
 */
export function LiveEarnings({ contract, className = '' }) {
  const ref = useRef(null);

  useEffect(
    () =>
      subscribe((now) => setText(ref.current, fmtMoney(miningAccrued(contract, now)))),
    [contract],
  );

  return (
    <span ref={ref} className={className}>
      {fmtMoney(miningAccrued(contract, serverNow()))}
    </span>
  );
}

/** How far through its term an active contract is, 0–100. */
export function MiningProgress({ contract }) {
  const ref = useRef(null);

  useEffect(
    () =>
      subscribe((now) => {
        const el = ref.current;
        if (!el) return;
        const total = Number(contract?.totalReturn) || 0;
        const pct = total ? (miningAccrued(contract, now) / total) * 100 : 0;
        const next = `${pct}%`;
        if (el.style.width !== next) el.style.width = next;
      }),
    [contract],
  );

  const total = Number(contract?.totalReturn) || 0;
  const initial = total ? (miningAccrued(contract, serverNow()) / total) * 100 : 0;

  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'rgba(148,163,184,.15)' }}>
      <div
        ref={ref}
        className="h-full rounded-full"
        style={{ width: `${initial}%`, background: 'linear-gradient(90deg, #2f8a68, #5ee0a9)' }}
      />
    </div>
  );
}

/** A countdown to a contract's maturity, ticking in place. */
export function Countdown({ to, className = '' }) {
  const ref = useRef(null);

  useEffect(() => subscribe((now) => setText(ref.current, format(now, to))), [to]);

  return (
    <span ref={ref} className={className}>
      {format(serverNow(), to)}
    </span>
  );
}

function format(now, to) {
  const diff = new Date(to).getTime() - now;
  if (!(diff > 0)) return 'Matured';
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${d}d ${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
}

/**
 * Every active contract's accrual combined — the "earnings are coming in"
 * figure at the top of the page.
 */
export function TotalMiningEarnings({ contracts, className = '' }) {
  const ref = useRef(null);

  // The tick reads the contracts through a ref so it always sees the latest
  // list without the effect having to resubscribe every time the parent hands
  // down a new array of the same contracts.
  const latest = useRef(contracts);
  useEffect(() => {
    latest.current = contracts;
  });

  useEffect(
    () =>
      subscribe((now) =>
        setText(
          ref.current,
          fmtMoney(latest.current.reduce((s, c) => s + miningAccrued(c, now), 0)),
        ),
      ),
    [],
  );

  return (
    <span ref={ref} className={className}>
      {fmtMoney(contracts.reduce((s, c) => s + miningAccrued(c, serverNow()), 0))}
    </span>
  );
}
