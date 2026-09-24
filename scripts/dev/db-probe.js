/* Throwaway: read the live Neon state directly and report the accounts/users
   mismatch that keeps bouncing people from /dashboard back to /login. */
const fs = require('fs');
const path = require('path');
const { neon } = require('@neondatabase/serverless');

const env = Object.fromEntries(
  fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
    })
);

const sql = neon(env.DATABASE_URL);

(async () => {
  const rows = await sql`SELECT key, data, updated_at FROM app_state ORDER BY key`;
  const state = {};
  for (const r of rows) state[r.key] = r.data;

  console.log(`${rows.length} keys in app_state\n`);
  for (const r of rows) {
    const n = Array.isArray(r.data) ? `${r.data.length} rows` : 'object';
    console.log(`  ${r.key.padEnd(26)} ${n.padEnd(10)} ${new Date(r.updated_at).toISOString()}`);
  }

  const accounts = state['col:accounts'] || [];
  const users = state['col:users'] || [];

  console.log(`\naccounts: ${accounts.length}   users: ${users.length}`);
  console.log('\n  account -> profile');
  for (const a of accounts) {
    const u = users.find((x) => x.id === a.userId);
    console.log(
      `  ${(a.email || '?').padEnd(38)} ${String(a.userId).padEnd(12)} ` +
        (u ? `OK   ${u.name}  balance=${u.balance}` : 'NO PROFILE ROW')
    );
  }

  const orphans = accounts.filter((a) => !users.find((u) => u.id === a.userId));
  console.log(`\n${orphans.length} of ${accounts.length} accounts cannot reach /dashboard.`);

  const sessions = state['col:sessions'] || [];
  console.log(`sessions: ${sessions.length}, newest ${sessions.slice(-3).map((s) => s.id || s.token || '?').join(', ')}`);
})().catch((e) => {
  console.error('THREW', e.message);
  process.exit(1);
});
