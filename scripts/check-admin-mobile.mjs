/**
 * Renders the admin console at phone width on a running server and reports
 * whether the tab bar is actually visible — the thing markup alone cannot tell
 * you, because the console renders its chrome client-side after a session check.
 *
 *   node scripts/check-admin-mobile.mjs [baseUrl]
 *
 * Writes scripts/out/admin-mobile.png for eyeballing.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { chromium } from 'playwright-core';

const BASE = process.argv[2] || 'http://localhost:3000';
const PASSWORD = process.env.ADMIN_PASSWORD || 'BigGod123';
const OUT = path.join(process.cwd(), 'scripts', 'out');

/**
 * Use whatever Chromium is already in the Playwright cache. The client package
 * and the cached browser build can disagree on revision, and re-downloading
 * ~150 MB to look at one page is not worth it.
 */
function findChromium() {
  const root = path.join(os.homedir(), 'AppData', 'Local', 'ms-playwright');
  if (!fs.existsSync(root)) return undefined;
  for (const dir of fs.readdirSync(root).filter((d) => d.startsWith('chromium'))) {
    for (const rel of [
      ['chrome-win64', 'chrome.exe'],
      ['chrome-headless-shell-win64', 'chrome-headless-shell.exe'],
    ]) {
      const p = path.join(root, dir, ...rel);
      if (fs.existsSync(p)) return p;
    }
  }
  return undefined;
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const executablePath = findChromium();
  console.log(`chromium: ${executablePath || '(using playwright default)'}`);
  const browser = await chromium.launch(executablePath ? { executablePath } : {});
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 }, // iPhone 14-ish
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();

  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  const login = await page.request.post(`${BASE}/api/admin/login`, {
    data: { password: PASSWORD },
  });
  console.log(`login: ${login.status()} ${await login.text()}`);

  await page.goto(`${BASE}/console-006cd676`, { waitUntil: 'networkidle' });
  // The console swaps its blank shell for the real UI once the session check
  // resolves; wait for a tab to exist rather than for the network to settle.
  await page.getByRole('button', { name: 'Settings' }).waitFor({ timeout: 15000 });

  const nav = await page.locator('nav').first().boundingBox();
  const navBottom = nav ? Math.round(nav.y + nav.height) : 0;
  console.log(`\nfixed nav occupies y=0..${navBottom}`);
  console.log(`scrollY at load: ${await page.evaluate(() => window.scrollY)}`);

  // Why is the content sitting under the fixed bar? Dump what <main> actually
  // computes, so the answer is a measurement rather than a guess.
  const mainInfo = await page.evaluate(() => {
    const m = document.querySelector('main');
    if (!m) return { found: false };
    const cs = getComputedStyle(m);
    const r = m.getBoundingClientRect();
    return {
      found: true,
      classes: m.className,
      paddingTop: cs.paddingTop,
      marginTop: cs.marginTop,
      top: Math.round(r.top),
      position: cs.position,
    };
  });
  console.log('main:', JSON.stringify(mainInfo));

  const vw = 390;
  for (const label of ['Users', 'Approvals', 'Settings']) {
    const box = await page.getByRole('button', { name: new RegExp(`^${label}`) }).first().boundingBox();
    if (!box) {
      console.log(`  ${label.padEnd(10)} NOT FOUND`);
      continue;
    }
    const left = Math.round(box.x);
    const right = Math.round(box.x + box.width);
    const top = Math.round(box.y);
    const bottom = Math.round(box.y + box.height);
    const acrossOk = left >= 0 && right <= vw;
    const behindNav = top < navBottom;
    const state = !acrossOk ? 'CLIPPED SIDEWAYS' : behindNav ? `HIDDEN BEHIND NAV (top ${top} < ${navBottom})` : 'visible';
    console.log(
      `  ${label.padEnd(10)} x=${String(left).padStart(4)}..${String(right).padStart(4)}  y=${String(top).padStart(4)}..${String(bottom).padStart(4)}  ${state}`,
    );
  }

  // Anything spilling past the viewport edge would mean a horizontal scroll.
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  console.log(`\nhorizontal overflow: ${overflow}px ${overflow > 0 ? '(page scrolls sideways)' : '(none)'}`);

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(200);
  const file = path.join(OUT, 'admin-mobile.png');
  await page.screenshot({ path: file, fullPage: false });
  console.log(`screenshot: ${file}`);

  await browser.close();
}

main().catch((e) => {
  console.error('failed:', e.message);
  process.exit(1);
});
