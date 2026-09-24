/* Throwaway: does the app actually default to white, does data-theme="dark"
   bring the old palette back, and are the tier tones readable in both? Renders
   the app's own compiled stylesheet over the real markup shapes. */
const { chromium } = require('playwright-core');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = 'http://localhost:3000';

const TONES = ['g', 'y', 'p', 'b', 'r', 'n', 'o'];

const card = (t) => `
  <div class="card card-glow card-glow-${t}" data-t="${t}">
    <h3 class="hi" style="margin:0 0 6px">Gold Plan</h3>
    <p class="mut" style="margin:0 0 6px">invested · returns 3x</p>
    <span class="pill pill-tone">12% ROI</span>
  </div>`;

const page = (label) => `
  <main style="padding:12px">
    <h1 class="hi" style="font-size:18px;margin:0 0 4px">${label}</h1>
    <p class="mut" style="font-size:12px;margin:0 0 10px">secondary text</p>
    <div class="panel" style="padding:12px;margin-bottom:12px">
      <p class="hi" style="margin:0">inside a panel</p>
    </div>
    <div class="balance-band" style="padding:12px;margin-bottom:12px">
      <p class="hi" style="margin:0">inside the band</p>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      ${TONES.map(card).join('')}
    </div>
  </main>`;

// WCAG relative luminance + ratio, so "readable" is a number and not a feeling.
// `over()` composites a translucent colour onto an opaque one, because a pill's
// tint is 16% alpha and reading its rgb as if it were opaque measures nothing.
const RATIO = `
function lum(c){const [r,g,b]=c.match(/\\d+(\\.\\d+)?/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)});return 0.2126*r+0.7152*g+0.0722*b}
function ratio(a,b){const l1=lum(a),l2=lum(b);return (Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05)}
function over(fg,bg){
  const f=fg.match(/[\\d.]+/g).map(Number), b=bg.match(/[\\d.]+/g).map(Number);
  const a=f.length>3?f[3]:1;
  const c=[0,1,2].map(i=>Math.round(f[i]*a+b[i]*(1-a)));
  return 'rgb('+c.join(',')+')';
}`;

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  const p = await browser.newPage({ viewport: { width: 420, height: 1200 }, deviceScaleFactor: 2 });
  const css = await (await p.request.get(`${BASE}/_next/static/css/app/layout.css`)).text();

  let bad = 0;

  for (const theme of ['light', 'dark']) {
    await p.setContent(
      `<!doctype html><html${theme === 'dark' ? ' data-theme="dark"' : ''}>
       <head><meta charset="utf-8"><style>${css}</style></head>
       <body>${page(theme === 'dark' ? 'Dark' : 'Light (default)')}</body></html>`,
      { waitUntil: 'networkidle' }
    );
    await p.waitForTimeout(250);
    await p.screenshot({ path: `scripts/out/shots/theme-${theme}.png`, fullPage: true });

    const r = await p.evaluate((src) => {
      eval(src);
      const cs = (el, prop) => getComputedStyle(el).getPropertyValue(prop);
      const body = getComputedStyle(document.body);
      const bg = body.backgroundColor;
      const rows = [...document.querySelectorAll('[data-t]')].map((el) => {
        const s = getComputedStyle(el);
        const pill = el.querySelector('.pill-tone');
        return {
          t: el.dataset.t,
          rim: s.borderTopColor,
          halo: (s.boxShadow.match(/rgba?\([^)]+\)\s+0px\s+0px/) || ['(no halo)'])[0],
          pillText: cs(pill, 'color'),
          pillBg: cs(pill, 'background-color'),
          cardBg: s.backgroundColor,
        };
      });
      return {
        bg,
        bodyText: body.color,
        mutOnBg: ratio(cs(document.querySelector('.mut'), 'color'), bg),
        hiOnBg: ratio(cs(document.querySelector('.hi'), 'color'), bg),
        band: cs(document.querySelector('.balance-band'), 'backgroundImage').slice(0, 40),
        cards: rows,
      };
    }, RATIO);

    console.log(`\n=== ${theme.toUpperCase()} ===`);
    console.log(`  body bg          ${r.bg}`);
    console.log(`  body text        ${r.bodyText}`);
    console.log(`  contrast .hi/bg  ${r.hiOnBg.toFixed(2)}:1`);
    console.log(`  contrast .mut/bg ${r.mutOnBg.toFixed(2)}:1`);
    if (r.hiOnBg < 4.5) { console.log('  !! .hi fails 4.5:1'); bad++; }
    if (r.mutOnBg < 4.5) { console.log('  !! .mut fails 4.5:1'); bad++; }

    // Readability: the pill text on its own tinted background, per tone.
    for (const c of r.cards) {
      const onCard = await p.evaluate(({ src, t, bg }) => {
        eval(src);
        return ratio(t, bg);
      }, { src: RATIO, t: c.pillText, bg: c.cardBg });
      const own = await p.evaluate(({ src, t, bg }) => {
        eval(src);
        return ratio(t, bg);
      }, { src: RATIO, t: c.pillText, bg: c.pillBg });
      const flag = own < 4.5 ? '  !!' : '';
      if (own < 4.5) bad++;
      console.log(`  tone ${c.t}  rim ${c.rim.padEnd(22)} pill ${c.pillText.padEnd(20)} on-card ${onCard.toFixed(2)} on-own ${own.toFixed(2)}${flag}`);
    }

    const distinct = new Set(r.cards.map((c) => c.rim)).size;
    console.log(`  distinct rims    ${distinct} of ${r.cards.length}`);
    if (distinct !== r.cards.length) { console.log('  !! two tones share a rim colour'); bad++; }
    const noHalo = r.cards.filter((c) => c.halo === '(no halo)').length;
    if (noHalo) { console.log(`  !! ${noHalo} cards have no halo`); bad++; }
  }

  console.log(bad ? `\nFAILURES: ${bad}` : '\nALL CHECKS PASSED');
  await browser.close();
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.error('THREW', e.message); process.exit(1); });
