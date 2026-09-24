/* Throwaway: does the floating tab bar actually look like glass?
   Renders the app's own compiled stylesheet over the app's own background,
   with content behind the bar so the blur has something to blur. No account,
   no database — this only proves the material, not the wiring. */
const { chromium } = require('playwright-core');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = 'http://localhost:3000';

const ITEMS = [
  ['Home', 'M3 12l9-9 9 9v8a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1z'],
  ['Invest', 'M3 17l6-6 4 4 8-8'],
  ['Inventory', 'M3 7h18v10H3z'],
  ['Mining', 'M12 3v18M3 12h18'],
  ['Account', 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 20a8 8 0 0116 0'],
];

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });

  const css = await (await page.request.get(`${BASE}/_next/static/css/app/layout.css`)).text();

  const cards = Array.from({ length: 20 })
    .map(
      (_, i) => `<div class="card" style="margin-bottom:14px">
        <p class="mut" style="font-size:11px;margin:0 0 6px">Active contract ${i + 1}</p>
        <p style="font-size:20px;font-weight:700;margin:0" class="grn">$${(1200 + i * 340).toLocaleString()}</p>
      </div>`
    )
    .join('');

  const nav = `<nav class="tab-glass" aria-label="Primary"><div class="tab-glass__inner">
    ${ITEMS.map(
      ([label, d], i) => `<a href="#" class="tab-glass__item ${i === 0 ? 'is-on' : ''}">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
             stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>
        <span>${label}</span></a>`
    ).join('')}
  </div></nav>`;

  await page.setContent(
    `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head>
     <body><main style="padding:12px 10px">${cards}</main>${nav}
     <script>document.body.style.minHeight='200vh'<\/script></body></html>`,
    { waitUntil: 'networkidle' }
  );
  await page.waitForTimeout(500);

  await page.evaluate(() => window.scrollTo(0, 260));
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'scripts/out/shots/tab-glass.png' });
  await page.screenshot({ path: 'scripts/out/shots/tab-glass-crop.png', clip: { x: 0, y: 640, width: 390, height: 204 } });

  const geo = await page.evaluate(() => {
    const bar = document.querySelector('.tab-glass');
    const r = bar.getBoundingClientRect();
    const cs = getComputedStyle(bar);
    const on = bar.querySelector('.is-on');
    return {
      float: `sides ${Math.round(r.left)}/${Math.round(innerWidth - r.right)}  bottom ${Math.round(innerHeight - r.bottom)}`,
      size: `${Math.round(r.width)}x${Math.round(r.height)}`,
      radius: cs.borderRadius,
      blur: cs.backdropFilter,
      ground: cs.backgroundColor,
      activeLozenge: getComputedStyle(on).borderRadius + ' ' + getComputedStyle(on).backgroundColor,
    };
  });
  console.log(JSON.stringify(geo, null, 2));

  await browser.close();
})().catch((e) => { console.error('THREW', e.message); process.exit(1); });
