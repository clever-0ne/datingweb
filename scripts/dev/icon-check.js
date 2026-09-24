/* Throwaway: what does the mark actually render as, desktop vs phone, and do
   the PWA icons resolve? */
const { chromium } = require('playwright-core');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = 'http://localhost:3000';

const ROUTES = ['/', '/login', '/register', '/dashboard'];

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });

  for (const width of [1280, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    for (const route of ROUTES) {
      await page.goto(BASE + route, { waitUntil: 'networkidle' }).catch(() => {});
      await page.waitForTimeout(400);
      const marks = await page.evaluate(() => {
        return [...document.querySelectorAll('img')]
          .filter((i) => /logo|tesla/i.test(i.getAttribute('src') || ''))
          .map((i) => {
            const cs = getComputedStyle(i);
            const r = i.getBoundingClientRect();
            return {
              src: i.getAttribute('src'),
              filter: cs.filter,
              visible: r.width > 0 && r.height > 0,
              h: Math.round(r.height),
            };
          });
      });
      const label = `${String(width).padEnd(5)} ${route.padEnd(11)}`;
      if (!marks.length) console.log(`${label} (no mark)`);
      for (const m of marks) {
        console.log(`${label} ${m.src.padEnd(22)} h=${String(m.h).padEnd(4)} visible=${m.visible} filter=${m.filter}`);
      }
    }
    await page.close();
  }

  // Do the manifest's icons actually resolve, and what does the manifest say?
  const page = await browser.newPage();
  const man = await (await page.request.get(`${BASE}/manifest.json`)).json();
  console.log('\nmanifest theme/background:', man.theme_color, man.background_color);
  for (const icon of man.icons) {
    const r = await page.request.get(BASE + icon.src);
    const buf = await r.body();
    const isPng = buf[0] === 0x89 && buf[1] === 0x50;
    console.log(`  ${r.status()} ${icon.purpose.padEnd(9)} ${icon.src}  ${buf.length}b png=${isPng}`);
  }
  const apple = await page.request.get(`${BASE}/assets/apple-touch-icon.png`);
  console.log(`  ${apple.status()} apple-touch ${(await apple.body()).length}b`);

  await browser.close();
})().catch((e) => { console.error('THREW', e.message); process.exit(1); });
