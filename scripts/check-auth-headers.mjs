/**
 * Screenshots the two login screens at phone and desktop width and reports what
 * the header actually contains, so "the top is crowded" is checked against the
 * rendered page rather than the JSX.
 *
 *   node scripts/check-auth-headers.mjs [baseUrl]
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { chromium } from 'playwright-core';

const BASE = process.argv[2] || 'http://localhost:3000';
const OUT = path.join(process.cwd(), 'scripts', 'out');

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

const PAGES = [
  ['admin-login', '/admin/login'],
  ['user-login', '/login'],
];

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const executablePath = findChromium();
  const browser = await chromium.launch(executablePath ? { executablePath } : {});

  for (const [viewportName, size] of [
    ['mobile', { width: 390, height: 844 }],
    ['desktop', { width: 1280, height: 800 }],
  ]) {
    const ctx = await browser.newContext({ viewport: size, deviceScaleFactor: 2 });
    const page = await ctx.newPage();

    for (const [name, url] of PAGES) {
      await page.goto(`${BASE}${url}`, { waitUntil: 'networkidle' });

      const header = await page.evaluate(() => {
        const h = document.querySelector('header');
        if (!h) return { found: false };
        const img = h.querySelector('img');
        const r = img ? img.getBoundingClientRect() : null;
        // Everything the header paints, to catch text that should not be there.
        const text = h.innerText.replace(/\s+/g, ' ').trim();
        return {
          found: true,
          text: text || '(no text)',
          logoHeight: r ? Math.round(r.height) : null,
          logoWidth: r ? Math.round(r.width) : null,
          headerHeight: Math.round(h.getBoundingClientRect().height),
        };
      });

      console.log(
        `${viewportName.padEnd(8)} ${name.padEnd(12)} logo ${
          header.logoWidth ? `${header.logoWidth}x${header.logoHeight}px` : 'MISSING'
        }  headerText="${header.text}"`,
      );

      await page.screenshot({
        path: path.join(OUT, `${name}-${viewportName}.png`),
        fullPage: false,
      });
    }
    await ctx.close();
  }

  console.log(`\nscreenshots in ${OUT}`);
  await browser.close();
}

main().catch((e) => {
  console.error('failed:', e.message);
  process.exit(1);
});
