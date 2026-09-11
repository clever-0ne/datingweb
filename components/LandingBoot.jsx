'use client';

import { useEffect } from 'react';
import { VENDOR_JS, BOOT_JS } from '@/lib/theme-assets';

/**
 * Loads and boots the Conult theme's vendor bundle on the public marketing
 * pages.
 *
 * The scripts are injected from this effect rather than rendered as
 * `<script src>` markup. Rendered as markup they execute while the browser is
 * still parsing the server HTML, i.e. *before* React hydrates — and the
 * theme's own initialisers then rewrite DOM that React owns. Odometer is the
 * loud one: it adds `odometer-auto-theme` plus its digit ribbons to every
 * `.odometer` element, so React finds a className it did not render and
 * reports a hydration mismatch (which Next's dev overlay surfaces as an
 * error). Loading them one tick later keeps them off React's toes.
 *
 * jQuery, Swiper and Odometer must be present in order, so the scripts are
 * inserted with `async = false` — which the HTML spec defines as "download in
 * parallel, execute in insertion order". Appending them together is therefore
 * both ordered AND parallel, where the original code chained them and paid a
 * fresh round trip for each of the seven files.
 *
 * conult.js is held back until the rest have run, since it initialises against
 * them and has no ordering guarantee of its own.
 */

// Module scope, so a client-side route change back to a marketing page does
// not fetch and re-execute the whole bundle.
let vendorLoad = null;

/** Insert one script, resolving on load OR error — a missing vendor file must
 *  not stall the ones after it. */
function inject(src) {
  return new Promise((resolve) => {
    const existing = document.querySelector(`script[data-theme-vendor="${src}"]`);
    if (existing) {
      resolve();
      return;
    }
    const el = document.createElement('script');
    // Set before insertion: async=false is what buys ordered execution.
    el.async = false;
    el.src = src;
    el.dataset.themeVendor = src;
    el.onload = resolve;
    el.onerror = resolve;
    document.body.appendChild(el);
  });
}

function loadVendors() {
  if (vendorLoad) return vendorLoad;
  // All at once: the browser fetches them concurrently but runs them in this
  // order. Awaiting the last insertion covers every earlier one.
  vendorLoad = Promise.all(VENDOR_JS.map(inject))
    .then(() => inject(BOOT_JS))
    .catch(() => {
      /* fall through to boot(); it guards on each global being present */
    });
  return vendorLoad;
}

export default function LandingBoot() {
  useEffect(() => {
    // The Conult theme is light; the app's own body gradient is dark. Without
    // this the theme's navy headings land on navy and disappear.
    document.body.classList.add('conult-page');

    let cancelled = false;
    const cleanups = [];

    const boot = () => {
      if (cancelled) return;

      // Counters. Odometer reads its starting value out of the element's own
      // text, and conult.js only fills that in once the element scrolls into
      // view — so seed it from data-count first, then let Odometer animate.
      if (window.jQuery) {
        const $ = window.jQuery;
        $('.odometer').each(function () {
          if (!$(this).text().trim() || $(this).text().trim() === '0') {
            $(this).text($(this).attr('data-count') || '0');
          }
        });
      }
      // Loaded after DOMContentLoaded, so odometer's own auto-init listener
      // has already been and gone — run it by hand.
      if (window.Odometer && typeof window.Odometer.init === 'function') {
        try {
          window.Odometer.init();
        } catch (e) {
          /* a malformed count should not take the page down */
        }
      }

      // Hero slider — options come from the same data-swiper-options attribute
      // the theme markup has always carried.
      document.querySelectorAll('.thm-swiper__slider').forEach((el) => {
        if (el.dataset.booted === '1') return;

        let options;
        try {
          options = JSON.parse(el.dataset.swiperOptions || '{}');
        } catch (e) {
          return;
        }

        if (typeof window.Swiper !== 'function') return;
        const instance = new window.Swiper(el, options);
        el.dataset.booted = '1';
        cleanups.push(() => {
          instance.destroy(true, true);
          delete el.dataset.booted;
        });
      });
    };

    loadVendors().then(boot);

    return () => {
      cancelled = true;
      document.body.classList.remove('conult-page');
      cleanups.forEach((fn) => {
        try {
          fn();
        } catch (e) {
          /* the slider may already be gone during teardown */
        }
      });
    };
  }, []);

  return null;
}
