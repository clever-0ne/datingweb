/**
 * One-time migration: split the old single jsonb row ('app-state') into one row
 * per collection ('col:<name>'), the shape the sharded lib/db.js now reads.
 *
 *   node scripts/migrate-schema.mjs            migrate
 *   node scripts/migrate-schema.mjs --dry-run  show what would be written
 *
 * It reads the old row, writes each top-level key to its own row, and leaves
 * the old row in place (readDb ignores it, so the migration is non-destructive
 * and reversible). Keys missing from the old blob are skipped so the new code
 * falls back to its seed defaults.
 */

import fs from 'fs';
import path from 'path';
import { neon } from '@neondatabase/serverless';

const ROOT = process.cwd();

const COLLECTIONS = [
  'dashboardStats', 'settings', 'admin', 'sessions', 'accounts', 'users',
  'deposits', 'withdrawals', 'orders', 'mining', 'investments',
  'miningWithdrawals', 'investmentWithdrawals', 'notifications', 'boosts',
  'pushSubscriptions', 'activity',
];

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
  const dryRun = process.argv.includes('--dry-run');
  const url = databaseUrl();
  if (!url) {
    console.error('DATABASE_URL is not set, and .env.local has no DATABASE_URL line.');
    process.exit(1);
  }

  const sql = neon(url);
  await sql`
    CREATE TABLE IF NOT EXISTS app_state (
      key        text PRIMARY KEY,
      data       jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )`;

  const old = await sql`SELECT data FROM app_state WHERE key = 'app-state'`;
  if (!old.length) {
    console.log('No single-blob row found — nothing to migrate (fresh DB will seed itself).');
    return;
  }

  const state = old[0].data;
  const present = COLLECTIONS.filter((k) => state[k] !== undefined && state[k] !== null);

  if (dryRun) {
    console.log(`Would migrate ${present.length} collection(s):\n  ${present.join('\n  ')}`);
    return;
  }

  for (const k of present) {
    await sql`
      INSERT INTO app_state (key, data, updated_at)
      VALUES (${`col:${k}`}, ${JSON.stringify(state[k])}::jsonb, now())
      ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`;
  }

  console.log(`Migrated ${present.length} collections (old row left in place, now ignored).`);
}

main().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
