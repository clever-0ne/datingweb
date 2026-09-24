/* Throwaway: the console still works after being moved off /admin.
   Drives a real browser, because the API guard reads Origin and Referer —
   headers curl sets by hand and a browser sets for real. */
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = 'http://localhost:3000';

// The console's address is in lib/console.js, which is the point of it.
const CONSOLE_PATH = fs
  .readFileSync(path.join(__dirname, '..', '..', 'lib', 'console.js'), 'utf8')
  .match(/CONSOLE_PATH = '([^']+)'/)[1];

const password = fs
  .readFileSync(path.join(__dirname, '..', '..', '.env.local'), 'utf8')
  .match(/^ADMIN_PASSWORD=(.*)$/m)[1]
  .trim();

const ok = (label, pass, extra = '') =>
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${label}${extra ? ' — ' + extra : ''}`);

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  const failures = [];
  page.on('response', (r) => {
    const u = new URL(r.url());
    if (u.pathname.startsWith('/api/admin') && r.status() >= 400) {
      failures.push(`${r.status()} ${u.pathname} (from ${new URL(page.url()).pathname})`);
    }
  });

  const status = async (url) => (await page.goto(url).catch(() => null))?.status() ?? 404;
  ok('old address is gone', (await status(`${BASE}/admin`)) === 404);
  ok('old login is gone', (await status(`${BASE}/admin/login`)) === 404);
  const body = await (await page.request.get(`${BASE}/admin`)).text();
  ok('the 404 does not name the console', !body.includes('console-'), body.length + ' bytes');

  const res = await page.goto(`${BASE}${CONSOLE_PATH}/login`, { waitUntil: 'networkidle' });
  ok('console login renders', res.status() === 200, CONSOLE_PATH);

  await page.fill('input[type="password"]', password);
  await Promise.all([
    page.waitForURL((u) => !u.pathname.endsWith('/login'), { timeout: 25000 }),
    page.click('button[type="submit"]'),
  ]);
  ok('signs in and lands on the console', page.url().includes(CONSOLE_PATH), page.url());

  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2500);

  const shell = await page.locator('text=Admin Console').count();
  ok('console chrome rendered', shell > 0);

  const rows = await page.locator('table tbody tr, [class*="rounded"] >> nth=0').count();
  ok('console has content', rows > 0, `${rows} blocks`);

  // The login screen mounts AdminLayout, which starts the push hook before its
  // isLogin early-return � so that one endpoint is probed with no session and
  // is expected to refuse. Anything else being refused is a real failure.
  const onLogin = failures.filter((f) => f.includes('/login'));
  const elsewhere = failures.filter((f) => !f.includes('/login'));
  ok('push probe on the login screen is the only refusal', failures.length === onLogin.length && onLogin.length > 0, failures.join(' | ') || 'none');
  ok('nothing refused once signed in', elsewhere.length === 0, elsewhere.join(', ') || 'clean');

  const robots = await page.request.get(`${BASE}/robots.txt`);
  ok('robots.txt is served', robots.status() === 200);
  const robotsTxt = await robots.text();
  ok('robots.txt stays quiet about the console', !robotsTxt.includes('console-'));

  await browser.close();
})().catch((e) => {
  console.error('THREW', e.message);
  process.exit(1);
});
