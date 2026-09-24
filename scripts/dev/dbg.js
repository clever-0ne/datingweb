const { chromium } = require('playwright-core');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

/** Does the querySelector error come from /account, or from every page? */
(async () => {
  const b = await chromium.launch({ executablePath: CHROME });
  for (const route of ['/', '/login', '/register']) {
    const ctx = await b.newContext();
    const p = await ctx.newPage();
    const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    await p.goto('http://localhost:3000' + route, { waitUntil: 'networkidle' });
    await p.waitForTimeout(1200);
    console.log(route.padEnd(11), errs.length ? errs.join(' | ') : 'clean');
    await ctx.close();
  }
  // And the signed-in pages, via a fresh account.
  const ctx = await b.newContext();
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
  await p.evaluate(async () => {
    await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Err Probe', email: `err.probe.${Date.now()}@example.com`,
        password: 'password123', phone: '+10000000000', address: '1 Test Street',
      }),
    });
  });
  for (const route of ['/dashboard', '/account']) {
    errs.length = 0;
    await p.goto('http://localhost:3000' + route, { waitUntil: 'networkidle' });
    await p.waitForTimeout(1500);
    console.log(route.padEnd(11), errs.length ? errs.join(' | ') : 'clean');
  }
  await b.close();
})().catch((e) => { console.error('THREW', e.message); process.exit(1); });
