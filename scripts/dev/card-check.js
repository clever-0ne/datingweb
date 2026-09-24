/* Throwaway: do cards read as floating against the surfaces they actually sit
   on? Renders the app's own compiled stylesheet. Reproduces the dashboard's
   real nesting — cards inside the balance band — because a card on a band is
   the case that was invisible before. */
const { chromium } = require('playwright-core');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = 'http://localhost:3000';

const stat = (label, value, tone, note) => `
  <div class="card flex flex-col">
    <p class="faint" style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;margin:0 0 6px">${label}</p>
    <p class="${tone}" style="font-size:20px;font-weight:700;margin:0">${value}</p>
    <p class="mut" style="font-size:11px;margin:6px 0 0">${note}</p>
  </div>`;

const body = `
  <main style="padding:14px 12px">
    <!-- the dashboard's real case: cards lying on the balance band -->
    <div class="balance-band" style="padding:16px;margin-bottom:20px" data-probe="band">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        ${stat('Total balance', '$48,920.14', 'grn', '+2.4% today')}
        ${stat('Active contracts', '12', 'blut', '3 maturing')}
      </div>
    </div>

    <!-- card on a panel -->
    <div class="panel" style="padding:16px;margin-bottom:20px" data-probe="panel">
      <p class="mut" style="font-size:11px;margin:0 0 10px">Card on a panel</p>
      <div class="card" data-probe="onPanel">
        <p class="hi" style="font-size:15px;font-weight:600;margin:0">Contracts</p>
      </div>
    </div>

    <!-- lift / static / direct-on-page -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="card" data-probe="lift"><p class="hi" style="margin:0;font-size:13px">Hover me</p></div>
      <div class="card card-static" data-probe="static"><p class="hi" style="margin:0;font-size:13px">Dialog</p></div>
    </div>
  </main>`;

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  const page = await browser.newPage({ viewport: { width: 400, height: 760 }, deviceScaleFactor: 2 });

  const css = await (await page.request.get(`${BASE}/_next/static/css/app/layout.css`)).text();

  await page.setContent(
    `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head>
     <body>${body}</body></html>`,
    { waitUntil: 'networkidle' }
  );
  await page.waitForTimeout(400);

  const probe = (sel) =>
    page.evaluate((s) => {
      const el = document.querySelector(s);
      const cs = getComputedStyle(el);
      const m = cs.backgroundImage.match(/rgb\([^)]+\)/g) || [];
      return { face: m[0] || cs.backgroundColor, top: +el.getBoundingClientRect().top.toFixed(1), transform: cs.transform };
    }, sel);

  const before = {
    band: await probe('[data-probe="band"]'),
    panel: await probe('[data-probe="panel"]'),
    onPanel: await probe('[data-probe="onPanel"]'),
    lift: await probe('[data-probe="lift"]'),
  };

  await page.screenshot({ path: 'scripts/out/shots/cards.png' });

  // hover the liftable card and the static one; only the first should move
  await page.hover('[data-probe="lift"]');
  await page.waitForTimeout(500);
  const hovered = await probe('[data-probe="lift"]');
  await page.screenshot({ path: 'scripts/out/shots/cards-hover.png', clip: { x: 0, y: 470, width: 400, height: 180 } });

  await page.hover('[data-probe="static"]');
  await page.waitForTimeout(500);
  const staticHovered = await probe('[data-probe="static"]');

  const lum = (s) => {
    const [r, g, b] = (s.match(/\d+/g) || []).map(Number);
    return Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
  };

  console.log(JSON.stringify({
    'band face': before.band.face + '  L=' + lum(before.band.face),
    'card on band': before.onPanel.face + '  L=' + lum(before.onPanel.face),
    'panel face': before.panel.face + '  L=' + lum(before.panel.face),
    'card on panel': before.lift.face + '  L=' + lum(before.lift.face),
    'card vs band lift': lum(before.lift.face) - lum(before.band.face) + ' levels',
    'card vs panel lift': lum(before.lift.face) - lum(before.panel.face) + ' levels',
    'rose on hover (px)': +(before.lift.top - hovered.top).toFixed(1),
    'dialog rose on hover (px)': +(before.lift.top - staticHovered.top).toFixed(1) + ' (must be 0)',
  }, null, 2));

  await browser.close();
})().catch((e) => { console.error('THREW', e.message); process.exit(1); });
