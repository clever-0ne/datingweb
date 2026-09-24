/* Throwaway: horizontal overflow across the shipped breakpoints. */
const { chromium } = require('playwright-core');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const WIDTHS = [320, 360, 390, 414, 560, 600, 768, 900, 1024, 1280, 1440, 1920];
const ROUTES = ['/', '/login', '/register'];

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  for (const route of ROUTES) {
    const line = [];
    for (const w of WIDTHS) {
      const page = await browser.newPage({ viewport: { width: w, height: 800 } });
      await page.goto('http://localhost:3000' + route, { waitUntil: 'networkidle' });
      await page.waitForTimeout(450);
      const over = await page.evaluate(() => {
        const doc = document.documentElement;
        return doc.scrollWidth - doc.clientWidth;
      });
      line.push(`${w}:${over > 0 ? '+' + over : 'ok'}`);
      await page.close();
    }
    console.log(route.padEnd(10), line.join('  '));
  }
  await browser.close();
})().catch((e) => { console.error('THREW', e.message); process.exit(1); });
