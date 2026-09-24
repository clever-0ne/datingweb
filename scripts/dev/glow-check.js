/* Throwaway: do the mining and investment tier cards each glow their own
   colour, does the chip agree with the glow, and does the selected state still
   show a ring now that a glow is also a box-shadow? Renders the app's own
   compiled stylesheet. */
const { chromium } = require('playwright-core');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = 'http://localhost:3000';

// Mirrors lib/ui.js, so this fails loudly if the two ever disagree.
const NAMED = { Starter: 'g', Bronze: 'o', Silver: 'n', Gold: 'y', Platinum: 'p', Diamond: 'b', Elite: 'g', Institutional: 'p', Whale: 'r' };
const tone = (name, i) => NAMED[name] || ['g', 'b', 'p', 'y'][i % 4];

const MINING = ['Starter', 'Silver', 'Gold', 'Platinum', 'Diamond'];
const INVEST = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Elite', 'Institutional', 'Whale'];

const tier = (name, i, sel) => `
  <div class="card card-glow card-glow-${tone(name, i)} flex flex-col ${sel ? 'card-sel' : ''}" data-t="${name}">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
      <h3 style="font-size:15px;font-weight:700;color:#fff;margin:0">${name}</h3>
      <span class="pill pill-tone" style="font-size:10px">3 days</span>
    </div>
    <p style="font-size:12px;color:#aab6c9;margin:0">invested · returns 3×</p>
  </div>`;

const grid = (names, selIdx) => `
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
    ${names.map((n, i) => tier(n, i, i === selIdx)).join('')}
  </div>`;

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  const page = await browser.newPage({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 2 });

  const css = await (await page.request.get(`${BASE}/_next/static/css/app/layout.css`)).text();

  await page.setContent(
    `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head>
     <body><main style="padding:12px">
       <p class="mut" style="font-size:11px;margin:0 0 8px">Cloud mining — Gold picked</p>
       ${grid(MINING, 2)}
       <p class="mut" style="font-size:11px;margin:14px 0 8px">Investment plans</p>
       ${grid(INVEST, -1)}
     </main></body></html>`,
    { waitUntil: 'networkidle' }
  );
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'scripts/out/shots/glow.png', fullPage: true });

  const rows = await page.evaluate(() =>
    [...document.querySelectorAll('[data-t]')].map((el) => {
      const cs = getComputedStyle(el);
      const pill = el.querySelector('.pill-tone');
      const halo = (cs.boxShadow.match(/rgba?\([^)]+\)\s+0px\s+0px[^,]*/) || ['(none)'])[0];
      return {
        tier: el.dataset.t,
        rim: cs.borderColor.replace(/\s/g, ''),
        halo: halo.replace(/\s+/g, ' ').trim(),
        pill: getComputedStyle(pill).color.replace(/\s/g, ''),
        sel: cs.boxShadow.includes('0px 0px 0px 2px'),
      };
    })
  );

  console.log(rows.map((r) => `${r.tier.padEnd(15)} rim ${r.rim.padEnd(24)} pill ${r.pill.padEnd(22)} ${r.sel ? 'RING' : ''}`).join('\n'));

  const distinct = new Set(rows.map((r) => r.rim)).size;
  const mismatched = rows.filter((r) => r.rim.replace('rgba(', '').split(',')[0] !== r.pill.replace('rgb(', '').split(',')[0]);
  console.log(`\ndistinct rims: ${distinct} of ${rows.length} cards`);
  console.log(`chip/glow mismatches: ${mismatched.length ? mismatched.map((m) => m.tier).join(', ') : 'none'}`);
  console.log(`selected card draws a ring: ${rows.some((r) => r.sel)}`);

  await browser.close();
})().catch((e) => { console.error('THREW', e.message); process.exit(1); });
