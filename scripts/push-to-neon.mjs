/**
 * Copy the local file database (data/db.json) into Neon.
 *
 *   node scripts/push-to-neon.mjs --dry-run   check what would be written
 *   node scripts/push-to-neon.mjs             write it
 *
 * The app stores its entire state as ONE jsonb row, so "migrating" is a single
 * upsert. Run this once when moving a local instance to a deployed one, so the
 * accounts, balances and contracts you already have carry over instead of the
 * deployed site starting from data/seed.json.
 *
 * It REPLACES whatever is in that row — there is no merge. That is the right
 * shape for a demo whose state is one document, and the --dry-run flag exists so
 * you can see the row you are about to overwrite first.
 *
 * Needs DATABASE_URL in the environment (or in .env.local, which this reads).
 */

import fs from 'fs';
import path from 'path';
import { neon } from '@neondatabase/serverless';

const ROOT = process.cwd();
const FILE = path.join(ROOT, 'data', 'db.json');
const ROW_KEY = 'app-state';

/** Read DATABASE_URL from the environment, falling back to .env.local. */
function databaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const envPath = path.join(ROOT, '.env.local');
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
      const match = line.match(/^\s*DATABASE_URL\s*=\s*(.+?)\s*$/);
      // Tolerate the quoted form .env files commonly use.
      if (match) return match[1].replace(/^["']|["']$/g, '');
    }
  }
  return null;
}

/** The driver may hand back a Date or an ISO string depending on column type
 *  parsing, so normalise before printing. */
function asDate(value) {
  return value instanceof Date ? value.toISOString() : String(value);
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  const url = databaseUrl();
  if (!url) {
    console.error('DATABASE_URL is not set, and .env.local has no DATABASE_URL line.');
    process.exit(1);
  }

  if (!fs.existsSync(FILE)) {
    console.error(`No local database at ${FILE} — nothing to push.`);
    process.exit(1);
  }

  const state = JSON.parse(fs.readFileSync(FILE, 'utf8'));

  const counts = Object.entries(state)
    .filter(([, v]) => Array.isArray(v))
    .map(([k, v]) => `${k}: ${v.length}`)
    .join('\n  ');

  console.log('Local state to push:');
  console.log('  ' + counts);

  if (dryRun) {
    console.log('\n--dry-run: nothing written.');
    return;
  }

  const sql = neon(url);

  await sql`
    CREATE TABLE IF NOT EXISTS app_state (
      key        text PRIMARY KEY,
      data       jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )`;

  const existing = await sql`SELECT updated_at FROM app_state WHERE key = ${ROW_KEY}`;
  if (existing.length) {
    console.log(`\nReplacing the existing row (last written ${asDate(existing[0].updated_at)}).`);
  }

  await sql`
    INSERT INTO app_state (key, data, updated_at)
    VALUES (${ROW_KEY}, ${JSON.stringify(state)}::jsonb, now())
    ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`;

  const [row] = await sql`SELECT updated_at FROM app_state WHERE key = ${ROW_KEY}`;
  console.log(`\nDone — wrote ${JSON.stringify(state).length} bytes at ${asDate(row.updated_at)}.`);
}

main().catch((err) => {
  console.error('\nPush failed:', err.message);
  process.exit(1);
});
