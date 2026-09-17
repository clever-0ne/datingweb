'use client';

import { useEffect, useRef } from 'react';

/**
 * The brand splash — the red T on the app's own near-black ground — shown
 * while a page loads and again on every refresh.
 *
 * It sits in the root layout, which client-side navigation does not remount,
 * so this fires on hard loads only and never between routes.
 *
 * It is server-rendered, so the mark is on screen at first paint instead of
 * appearing once React hydrates. That has a consequence worth naming: the
 * markup is already in the document, so if the script never runs, nothing here
 * would take it away. globals.css therefore retires the splash on its own
 * after five seconds, and this effect only ever dismisses it sooner.
 */
export default function PageLoader() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Long enough to read as a mark rather than a flicker of red.
    const MIN_MS = 650;
    // A page that never finishes loading must not trap the visitor behind it.
    const MAX_MS = 8000;

    const shownAt = performance.now();
    let dismissed = false;

    const dismiss = () => {
      if (dismissed) return;
      const remaining = Math.max(0, MIN_MS - (performance.now() - shownAt));
      window.setTimeout(() => {
        if (dismissed) return;
        dismissed = true;
        el.dataset.leaving = 'true';
      }, remaining);
    };

    if (document.readyState === 'complete') dismiss();
    else window.addEventListener('load', dismiss, { once: true });

    const cap = window.setTimeout(() => {
      dismissed = true;
      el.dataset.leaving = 'true';
    }, MAX_MS);

    return () => {
      window.removeEventListener('load', dismiss);
      window.clearTimeout(cap);
    };
  }, []);

  return (
    <div ref={ref} className="boot" role="status" aria-label="Loading Tesla Capital">
      <span className="boot__mark">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/tesla-t.svg" alt="" width="40" height="38" />
      </span>
      <span className="boot__word">Tesla Capital</span>
    </div>
  );
}
