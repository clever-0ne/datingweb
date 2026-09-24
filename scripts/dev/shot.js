/* Throwaway visual check: renders the public pages in system Chrome and writes
   PNGs to .shots/. Not part of the app; deleted once the repaint is verified. */
const { chromium } = require('playwright-core');
const fs = require('fs');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = 'http://localhost:3000';
const OUT = '.shots';

const VIEWS = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 844 },
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: CHROME });

  for (const v of VIEWS) {
    const page = await browser.newPage({
      viewport: { width: v.width, height: v.height },
      deviceScaleFactor: 1,
    });
    const errs = [];
    page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
    page.on('pageerror', (e) => errs.push(String(e)));

    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(700);

    // What is actually in the document, so a blank pixel region can be told
    // apart from missing content.
    const shape = await page.evaluate(() => {
      const reveals = [...document.querySelectorAll('.bf-reveal')];
      return {
        sections: document.querySelectorAll('section').length,
        reveals: reveals.length,
        hidden: reveals.filter((e) => parseFloat(getComputedStyle(e).opacity) < 0.9).length,
        docHeight: document.documentElement.scrollHeight,
        headings: [...document.querySelectorAll('h2')].map((h) => h.textContent.trim().slice(0, 48)),
      };
    });
    console.log(`[${v.name}]`, JSON.stringify(shape, null, 1));

    // Walk the page the way a reader does: scroll a viewport at a time and let
    // the reveal observer fire before capturing.
    const steps = Math.ceil(shape.docHeight / v.height);
    for (let i = 0; i < steps; i++) {
      await page.evaluate((y) => window.scrollTo(0, y), i * v.height);
      await page.waitForTimeout(650);
      await page.screenshot({ path: `${OUT}/scroll-${v.name}-${String(i).padStart(2, '0')}.png` });
    }

    const after = await page.evaluate(() => {
      const reveals = [...document.querySelectorAll('.bf-reveal')];
      return { hiddenAfterScroll: reveals.filter((e) => parseFloat(getComputedStyle(e).opacity) < 0.9).length };
    });
    console.log(`[${v.name}] after scroll:`, JSON.stringify(after), 'errors:', errs.length ? errs : 'none');
    await page.close();
  }

  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
