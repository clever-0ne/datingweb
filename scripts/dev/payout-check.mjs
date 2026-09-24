// Verifies both payout streams (mining + investment) end to end, and the
// notifications wired into the transaction routes. Restores data/db.json.
import fs from 'fs';

const DB = 'data/db.json';
const BASE = 'http://localhost:3000';
const backup = fs.readFileSync(DB, 'utf8');
const UID = 'TC-48-2091';

const cookie = (r) => (r.headers.getSetCookie?.() || []).map((c) => c.split(';')[0]).join('; ');
async function call(path, { method = 'GET', body, cookies } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(cookies ? { cookie: cookies } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json().catch(() => ({})), cookies: cookie(res) };
}

let fail = 0;
const check = (label, cond, detail = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${detail ? '  — ' + detail : ''}`);
  if (!cond) fail++;
};

/** Seed one matured row of the given kind for the test user. */
function seedMatured() {
  const db = JSON.parse(fs.readFileSync(DB, 'utf8'));
  const old = new Date(Date.now() - 86400000).toISOString();
  db.mining.push({
    id: 'M-PAYTEST', userId: UID, tierId: 'm1', tierName: 'Starter Miner',
    price: 1200, totalReturn: 3600, dailyEarnings: 800, days: 3,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(), expiresAt: old,
  });
  db.investments.push({
    id: 'I-PAYTEST', userId: UID, planId: 'p1', planName: 'Bronze',
    amount: 5000, roi: 400, termDays: 3, returnAmount: 25000,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(), maturesAt: old,
  });
  fs.writeFileSync(DB, JSON.stringify(db, null, 2));
}

const codeOf = (collection, id) =>
  JSON.parse(fs.readFileSync(DB, 'utf8'))[collection].find((w) => w.id === id).code;

/** Drive one full payout: request -> admin approve -> user confirms. */
async function runPayout({ label, endpoint, collection, adminBase, expectedGross }) {
  const req = await call(endpoint, { method: 'POST', cookies: U, body: { action: 'request' } });
  check(`${label}: request created`, req.data.ok === true, req.data.error || '');
  const id = req.data.request?.id;

  check(`${label}: request hides the code`, id && !('code' in req.data.request));
  check(`${label}: gross is ${expectedGross}`, req.data.request?.gross === expectedGross, String(req.data.request?.gross));
  check(`${label}: fee is 2%`, req.data.request?.fee === Math.round(expectedGross * 0.02 * 100) / 100, String(req.data.request?.fee));

  // A second request while one is open must be refused.
  const dup = await call(endpoint, { method: 'POST', cookies: U, body: { action: 'request' } });
  check(`${label}: a second open request is refused`, dup.data.ok !== true, dup.data.error || '(was allowed)');

  const before = (await call('/api/wallet', { cookies: U })).data.balance;

  // Confirming before approval must not pay out.
  const early = await call(endpoint, { method: 'POST', cookies: U, body: { action: 'confirm', id, code: '000000' } });
  check(`${label}: cannot confirm before approval`, early.data.ok !== true, early.data.error || '(was allowed)');

  await call(`${adminBase}/${id}`, { method: 'PATCH', cookies: A, body: { status: 'approved' } });
  const afterApprove = (await call('/api/wallet', { cookies: U })).data.balance;
  check(`${label}: approval moves no money`, afterApprove === before, `${before} -> ${afterApprove}`);

  const notif = (await call('/api/wallet', { cookies: U })).data.notifications.find((n) => /approved/i.test(n.title));
  check(`${label}: approval notification carries the code`, !!notif && notif.body.includes(codeOf(collection, id)));

  // Wrong code burns an attempt and moves nothing.
  const wrong = await call(endpoint, { method: 'POST', cookies: U, body: { action: 'confirm', id, code: '999999' } });
  check(`${label}: wrong code rejected`, wrong.data.ok !== true);
  check(`${label}: wrong code moves no money`, (await call('/api/wallet', { cookies: U })).data.balance === before);

  const done = await call(endpoint, { method: 'POST', cookies: U, body: { action: 'confirm', id, code: codeOf(collection, id) } });
  check(`${label}: correct code releases`, done.data.ok === true, done.data.error || '');
  check(`${label}: balance credited net of fee`, done.data.balance === Math.round((before + req.data.request.net) * 100) / 100, `${before} -> ${done.data.balance}`);

  // The released item must not be claimable again.
  const again = await call(endpoint, { method: 'POST', cookies: U, body: { action: 'request' } });
  check(`${label}: released items cannot be re-claimed`, again.data.ok !== true, again.data.error || '(was allowed)');

  // Replaying the confirm must not double-pay.
  const replay = await call(endpoint, { method: 'POST', cookies: U, body: { action: 'confirm', id, code: codeOf(collection, id) } });
  check(`${label}: replaying confirm does not double-pay`, replay.data.ok !== true);
  check(`${label}: balance unchanged after replay`, (await call('/api/wallet', { cookies: U })).data.balance === done.data.balance);
}

let U, A;
try {
  const ul = await call('/api/auth/login', { method: 'POST', body: { email: 'alexander.carter@teslacapital.io', password: 'password123' } });
  if (!ul.data.ok) throw new Error('customer login failed: ' + (ul.data.error || ul.status));
  U = ul.cookies;

  const al = await call('/api/admin/login', { method: 'POST', body: { email: 'admin@teslacapital.io', password: 'admin123' } });
  if (!al.data.ok) throw new Error('admin login failed: ' + (al.data.error || al.status));
  A = al.cookies;

  // Give the user funds so the purchase notifications can be exercised.
  {
    const db = JSON.parse(fs.readFileSync(DB, 'utf8'));
    db.users.find((u) => u.id === UID).balance = 100000;
    fs.writeFileSync(DB, JSON.stringify(db, null, 2));
  }
  seedMatured();

  const wallet = (await call('/api/wallet', { cookies: U })).data;
  check('matured mining shows withdrawable', wallet.mining.find((m) => m.id === 'M-PAYTEST')?.withdrawable === true);
  check('matured investment shows withdrawable', wallet.investments.find((i) => i.id === 'I-PAYTEST')?.withdrawable === true);
  check('wallet exposes investmentWithdrawals', Array.isArray(wallet.investmentWithdrawals));

  await runPayout({
    label: 'MINING',
    endpoint: '/api/mining/withdraw',
    collection: 'miningWithdrawals',
    adminBase: '/api/admin/mining-withdrawals',
    expectedGross: 3600,
  });

  await runPayout({
    label: 'INVESTMENT',
    endpoint: '/api/invest/withdraw',
    collection: 'investmentWithdrawals',
    adminBase: '/api/admin/investment-withdrawals',
    expectedGross: 25000,
  });

  /* ---- transaction notifications ---- */
  const before = (await call('/api/wallet', { cookies: U })).data.notifications.length;
  await call('/api/deposits', { method: 'POST', cookies: U, body: { amount: 500, coin: 'btc' } });
  await call('/api/withdrawals', { method: 'POST', cookies: U, body: { amount: 50, coin: 'btc', address: 'bc1qxyz' } });
  await call('/api/mining', { method: 'POST', cookies: U, body: { tierId: 'm1' } });
  await call('/api/invest', { method: 'POST', cookies: U, body: { planId: 'p1' } });
  await call('/api/purchase', { method: 'POST', cookies: U, body: { amount: 100, item: 'Test Item', type: 'order' } });
  const after = (await call('/api/wallet', { cookies: U })).data.notifications;
  check('every transaction raised a notification', after.length === before + 5, `${before} -> ${after.length}`);
  check('  notification kinds are set', after.slice(0, 5).every((n) => ['success', 'error', 'info'].includes(n.kind)));

  /* ---- admin queue shape ---- */
  const mq = (await call('/api/admin/mining-withdrawals', { cookies: A })).data.miningWithdrawals;
  const iq = (await call('/api/admin/investment-withdrawals', { cookies: A })).data.investmentWithdrawals;
  check('admin mining queue has the shared shape', mq.length > 0 && mq[0].kind === 'Mining' && mq[0].itemLabel === 'contracts' && typeof mq[0].items === 'number');
  check('admin investment queue has the shared shape', iq.length > 0 && iq[0].kind === 'Investment' && iq[0].itemLabel === 'plans' && typeof iq[0].items === 'number');
  check('admin queues never expose the code', !JSON.stringify(mq).includes('"code"') && !JSON.stringify(iq).includes('"code"'));
} catch (e) {
  console.error('THREW:', e.message);
  fail++;
} finally {
  fs.writeFileSync(DB, backup);
  console.log(`\ndb.json restored. ${fail ? fail + ' FAILURE(S)' : 'All checks passed.'}`);
}
