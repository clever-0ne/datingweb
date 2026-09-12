/**
 * Read-only probe: what is actually stored for the admin's deposit settings,
 * and when was it last written. Used to tell a real save apart from a UI that
 * merely says "Saved."
 *
 *   node scripts/peek-settings.mjs
 */

import fs from 'fs';
import path from 'path';
import { neon } from '@neondatabase/serverless';

const ROOT = process.cwd();

function databaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const envPath = path.join(ROOT, '.env.local');
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
      const m = line.match(/^\s*DATABASE_URL\s*=\s*(.+?)\s*$/);
      if (m) return m[1].replace(/^["']|["']$/g, '');
    }
  }
  return null;
}

async function main() {
  const url = databaseUrl();
  if (!url) {
    console.error('No DATABASE_URL (env or .env.local).');
    process.exit(1);
  }
  const sql = neon(url);

  const rows = await sql.query(
    "SELECT key, data, updated_at FROM app_state WHERE key = 'col:settings'",
  );
  if (!rows.length) {
    console.log('No col:settings row at all.');
    return;
  }

  const { data, updated_at } = rows[0];
  const ageMs = Date.now() - new Date(updated_at).getTime();
  console.log(`col:settings updated_at = ${new Date(updated_at).toISOString()}`);
  console.log(`  (${Math.round(ageMs / 1000)}s ago — ${(ageMs / 60000).toFixed(1)} min ago)\n`);

  const coins = data?.coins || [];
  if (!coins.length) {
    console.log('settings.coins is empty.');
  }
  for (const c of coins) {
    console.log(
      `${String(c.symbol || '?').padEnd(5)} rate=${String(c.rate).padEnd(10)} ${c.address || '(blank)'}`,
    );
  }

  // Every row's timestamp, so it is obvious which writes have moved recently.
  const all = await sql.query(
    "SELECT key, updated_at FROM app_state WHERE key LIKE 'col:%' ORDER BY updated_at DESC",
  );
  console.log('\nAll collections by last write:');
  for (const r of all) {
    console.log(`  ${new Date(r.updated_at).toISOString()}  ${r.key}`);
  }
}

main().catch((err) => {
  console.error('Probe failed:', err.message);
  process.exit(1);
});
