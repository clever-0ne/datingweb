/* Throwaway end-to-end check of the passkey ceremonies.
   Chrome exposes a virtual authenticator over CDP, so this registers a real
   credential and then signs in with it — attestation and assertion both get
   parsed and verified for real, not stubbed. Delete once verified. */
const { chromium } = require('playwright-core');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = 'http://localhost:3000';
const EMAIL = `passkey.test.${Date.now()}@example.com`;
const PASSWORD = 'password123';

const ok = (label, pass, extra = '') =>
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${label}${extra ? ' — ' + extra : ''}`);

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));

  // --- virtual authenticator -------------------------------------------------
  const cdp = await context.newCDPSession(page);
  await cdp.send('WebAuthn.enable');
  const { authenticatorId } = await cdp.send('WebAuthn.addVirtualAuthenticator', {
    options: {
      protocol: 'ctap2',
      transport: 'internal',
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
      automaticPresenceSimulation: true,
    },
  });
  ok('virtual authenticator attached', !!authenticatorId);

  // --- register, which leaves us signed in with a user record ----------------
  // A fresh account rather than a seeded one: the seeded rows in the live
  // database have accounts without matching user records, which the wallet
  // rejects. Registration creates both halves together.
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });

  const made = await page.evaluate(async (creds) => {
    const r = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(creds),
    });
    return { status: r.status, body: (await r.text()).slice(0, 160) };
  }, { name: 'Passkey Test', email: EMAIL, password: PASSWORD, phone: '+10000000000', address: '1 Test Street' });
  ok('account created', made.status === 200, made.body);

  await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' });
  ok('signed in after registration', page.url().includes('/dashboard'), page.url());

  // --- add a passkey from /account ------------------------------------------
  await page.goto(`${BASE}/account`, { waitUntil: 'networkidle' });
  const addBtn = page.getByRole('button', { name: /Add a passkey/i });
  await addBtn.waitFor({ timeout: 10000 });
  await addBtn.click();

  // The button flips to "Waiting for your device…" and back once it settles.
  await page.waitForFunction(
    () => !/Waiting for your device/.test(document.body.innerText),
    null,
    { timeout: 15000 },
  );
  await page.waitForTimeout(800);

  const listText = await page.locator('.panel', { hasText: 'Passkeys' }).innerText();
  ok('passkey appears in the account list', /Added /.test(listText), listText.split('\n').slice(0, 5).join(' | '));

  const registered = await page.evaluate(async () => {
    const r = await fetch('/api/auth/passkey');
    return r.json();
  });
  ok('server stored the credential', registered.ok && registered.passkeys.length === 1,
    `count=${registered.passkeys ? registered.passkeys.length : 'n/a'}`);

  const creds = await cdp.send('WebAuthn.getCredentials', { authenticatorId });
  ok('authenticator holds a discoverable credential', creds.credentials.length === 1,
    `residentKey=${creds.credentials[0] ? creds.credentials[0].isResidentCredential : 'n/a'}`);

  // --- sign out, then sign in with ONLY the passkey --------------------------
  await context.clearCookies();
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });

  const pkBtn = page.getByRole('button', { name: /Sign in with a passkey/i });
  await pkBtn.waitFor({ timeout: 10000 });
  ok('passkey button renders when supported', true);

  await pkBtn.click();
  await page.waitForURL('**/dashboard', { timeout: 15000 }).catch(() => {});
  ok('passkey sign-in reaches the dashboard', page.url().includes('/dashboard'), page.url());

  const who = await page.evaluate(async () => {
    const r = await fetch('/api/auth/me');
    return r.status === 200 ? r.json() : null;
  });
  ok('session belongs to the right account', !!who && (who.user?.email === EMAIL || who.email === EMAIL),
    JSON.stringify(who).slice(0, 120));

  // --- removing the passkey --------------------------------------------------
  const del = await page.evaluate(async () => {
    const list = await (await fetch('/api/auth/passkey')).json();
    if (!list.passkeys.length) return 'no passkeys';
    const r = await fetch(`/api/auth/passkey/${encodeURIComponent(list.passkeys[0].id)}`, { method: 'DELETE' });
    const after = await (await fetch('/api/auth/passkey')).json();
    return `delete=${r.status} remaining=${after.passkeys.length}`;
  });
  ok('passkey can be removed', del === 'delete=200 remaining=0', del);

  console.log('\npage errors:', errs.length ? errs : 'none');
  await browser.close();
})().catch((e) => {
  console.error('THREW:', e.message);
  process.exit(1);
});
