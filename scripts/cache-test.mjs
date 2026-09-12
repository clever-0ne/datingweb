/**
 * Diagnostic: does a running server's /api/coins reflect a database change made
 * behind its back?
 *
 * It marks the BTC coin's *name* — deliberately not the address. A wrong deposit
 * address, even for a second, is something a real user could copy and send funds
 * to; the display name carries no such risk. Original value is restored either
 * way.
 *
 *   node scripts/cache-test.mjs [baseUrl]     (default http://localhost:3000)
 */

import fs from 'fs';
import { neon } from '@neondatabase/serverless';

const BASE = process.argv[2] || 'http://localhost:3000';

async function getBtc() {
  const r = await fetch(`${BASE}/api/coins`, { cache: 'no-store' });
  const j = await r.json();
  return j.coins.find((c) => c.symbol === 'BTC');
}

async function main() {
  const env = fs.readFileSync('.env.local', 'utf8').split(/\r?\n/).find((l) => /^\s*DATABASE_URL\s*=/.test(l));
  const url = env.replace(/^\s*DATABASE_URL\s*=\s*/, '').trim().replace(/^["']|["']$/g, '');
  const sql = neon(url);

  const rows = await sql.query("SELECT data FROM app_state WHERE key = 'col:settings'");
  const settings = rows[0].data;
  const btc = settings.coins.find((c) => c.symbol === 'BTC');
  const original = btc.name;
  const marked = `${original}-MARKED`;

  console.log(`base url        : ${BASE}`);
  console.log(`db name         : ${JSON.stringify(original)}`);
  console.log(`endpoint before : ${JSON.stringify((await getBtc()).name)}`);

  btc.name = marked;
  await sql.query(
    "UPDATE app_state SET data = $1::jsonb, updated_at = now() WHERE key = 'col:settings'",
    [JSON.stringify(settings)],
  );
  console.log(`wrote to db     : ${JSON.stringify(marked)}`);

  const after = (await getBtc()).name;
  console.log(`endpoint after  : ${JSON.stringify(after)}`);
  console.log('');
  console.log(after === marked
    ? 'RESULT: endpoint picked up the change — readDb is NOT cached across requests.'
    : 'RESULT: endpoint did NOT pick up the change — readDb is serving a stale snapshot.');

  btc.name = original;
  await sql.query(
    "UPDATE app_state SET data = $1::jsonb, updated_at = now() WHERE key = 'col:settings'",
    [JSON.stringify(settings)],
  );
  console.log('');
  console.log(`restored        : db=${JSON.stringify(original)}  endpoint=${JSON.stringify((await getBtc()).name)}`);
}

main().catch((e) => {
  console.error('failed:', e.message);
  process.exit(1);
});
