/* Throwaway: does the brand splash appear on a hard load, retire on its own,
   stop intercepting clicks, and stay out of the way on client-side navigation? */
const { chromium } = require('playwright-core');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = 'http://localhost:3000';

const ok = (label, pass, extra = '') =>
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${label}${extra ? ' — ' + extra : ''}`);

const state = (page) =>
  page.evaluate(() => {
    const el = document.querySelector('.boot');
    if (!el) return { present: false };
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const mid = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
    return {
      present: true,
      leaving: el.dataset.leaving === 'true',
      opacity: Number(cs.opacity).toFixed(2),
      visibility: cs.visibility,
      pointerEvents: cs.pointerEvents,
      covers: r.width >= window.innerWidth && r.height >= window.innerHeight,
      onTop: el.contains(mid) || mid === el,
      mark: !!el.querySelector('.boot__mark img'),
      word: (el.querySelector('.boot__word') || {}).textContent,
    };
  });

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });

  for (const route of ['/', '/dashboard']) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

    await page.goto(BASE + route, { waitUntil: 'commit' });
    // At 'commit' the HTML is parsed but the stylesheet may not have applied
    // yet, so the splash can still be unstyled. Wait for the rule that makes it
    // a real overlay before judging where it sits.
    await page
      .waitForFunction(() => {
        const el = document.querySelector('.boot');
        return el && getComputedStyle(el).position === 'fixed';
      }, null, { timeout: 10000 })
      .catch(() => {});
    const early = await state(page);
    ok(`${route} splash is on screen at first paint`, early.present && !early.leaving,
      early.present ? `opacity=${early.opacity} mark=${early.mark} word="${early.word}"` : 'not in DOM');
    ok(`${route} splash covers the viewport`, early.covers && early.onTop);
    await page.screenshot({ path: `scripts/out/shots/boot-${route === '/' ? 'home' : 'dash'}.png` });

    await page.waitForLoadState('load');
    await page.waitForTimeout(1600);
    const after = await state(page);
    ok(`${route} splash retires itself`, after.present && after.leaving && after.visibility === 'hidden',
      `opacity=${after.opacity} visibility=${after.visibility}`);
    ok(`${route} splash no longer takes clicks`, after.pointerEvents === 'none', after.pointerEvents);

    // Client-side navigation must not bring it back. Clicking through a link
    // tears down the page context, so the click and the wait go together.
    const target = route === '/' ? '/about' : '/account';
    await Promise.all([
      page.waitForURL((u) => u.pathname === target, { timeout: 15000 }).catch(() => {}),
      page.click(`a[href="${target}"]`).catch(() => {}),
    ]);
    await page.waitForTimeout(900);
    const nav = await state(page);
    ok(`${route} → client-side nav does not re-show it`, !nav.present || nav.leaving,
      `present=${nav.present} leaving=${nav.leaving}`);

    await page.close();
  }

  // Prefers-reduced-motion: the spin must stop, the splash must still retire.
  const rm = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await rm.goto(BASE + '/', { waitUntil: 'commit' });
  const spin = await rm.evaluate(
    () => getComputedStyle(document.querySelector('.boot__mark'), '::after').animationName
  );
  ok('reduced motion stops the spin', spin === 'none', spin);
  await rm.waitForLoadState('load');
  await rm.waitForTimeout(1600);
  const rmAfter = await state(rm);
  ok('reduced motion still retires the splash', rmAfter.leaving, `visibility=${rmAfter.visibility}`);
  await rm.close();

  await browser.close();
})().catch((e) => {
  console.error('THREW', e.message);
  process.exit(1);
});
