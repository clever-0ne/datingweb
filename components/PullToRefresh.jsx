'use client';

import { useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';

const TRIGGER = 70; // px of (damped) pull needed to refresh
const MAX = 110;

/**
 * Pull down at the top of the page to reload — for the home-screen app only.
 * Browsers already have their own pull-to-refresh, and an installed PWA on iOS
 * has none, so this only switches on in standalone display mode.
 *
 * A pull is ignored when it starts inside anything fixed (modals, the mobile
 * drawer, the bottom nav) or inside a scroll box that is not at its top, so it
 * never fights with scrolling a list or a dialog.
 */
export default function PullToRefresh() {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const start = useRef(null);
  const pullRef = useRef(0);

  useEffect(() => {
    const standalone =
      window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
    if (!standalone) return;

    const blocked = (el) => {
      for (let n = el; n && n !== document.body; n = n.parentElement) {
        const cs = getComputedStyle(n);
        if (cs.position === 'fixed') return true;
        if (/(auto|scroll)/.test(cs.overflowY) && n.scrollTop > 0) return true;
      }
      return false;
    };

    const onStart = (e) => {
      if (e.touches.length !== 1 || window.scrollY > 0 || blocked(e.target)) {
        start.current = null;
        return;
      }
      start.current = e.touches[0].clientY;
    };

    const onMove = (e) => {
      if (start.current == null) return;
      const dy = e.touches[0].clientY - start.current;
      if (dy <= 0 || window.scrollY > 0) {
        if (pullRef.current) { pullRef.current = 0; setPull(0); }
        return;
      }
      e.preventDefault(); // stop the page bouncing while we show the indicator
      const d = Math.min(MAX, dy * 0.5);
      pullRef.current = d;
      setPull(d);
    };

    const onEnd = () => {
      if (start.current == null) return;
      start.current = null;
      if (pullRef.current >= TRIGGER) {
        setRefreshing(true);
        setPull(TRIGGER);
        window.location.reload();
      } else {
        pullRef.current = 0;
        setPull(0);
      }
    };

    document.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd, { passive: true });
    document.addEventListener('touchcancel', onEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onStart);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
      document.removeEventListener('touchcancel', onEnd);
    };
  }, []);

  if (!pull && !refreshing) return null;

  const ready = pull >= TRIGGER;
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 'calc(env(safe-area-inset-top, 0px) + 8px)',
        left: '50%',
        zIndex: 100,
        transform: `translate(-50%, ${pull - 40}px)`,
        opacity: Math.min(1, pull / TRIGGER),
        transition: start.current == null ? 'transform .2s ease, opacity .2s ease' : 'none',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fff',
          color: ready ? '#e82127' : '#555',
          boxShadow: '0 4px 14px rgba(0,0,0,.18)',
        }}
      >
        <RefreshCw
          size={20}
          style={{
            transform: `rotate(${pull * 3}deg)`,
            animation: refreshing ? 'ptr-spin .8s linear infinite' : 'none',
          }}
        />
      </div>
      <style>{`@keyframes ptr-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
