import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { neon } from '@neondatabase/serverless';
import { hashPassword } from './password';
import seed from '../data/seed.json';

/**
 * The app's storage layer. Every route reaches data through readDb()/writeDb(),
 * so this is the only file that knows where it actually lives.
 *
 *   DATABASE_URL set   → Neon Postgres, sharded across one row per collection
 *   DATABASE_URL unset → data/db.json on disk (local dev)
 *
 * WHY SHARDED, NOT ONE ROW — the first cut stored the whole state as a single
 * jsonb row. That meant every write rewrote the entire site (all users, all
 * transactions) and every read pulled the whole site back, so a write from one
 * user clobbered a concurrent write from another. Sharding one row per
 * collection makes a write touch only the collection it changed, and lets
 * unrelated requests no longer overwrite each other.
 *
 * readDb() reassembles the collections into the same flat object every route
 * already expects, so the routes did not change. writeDb() diffs against the
 * values readDb() returned (the object is the same reference — routes mutate it
 * in place) and only persists the collections that actually changed.
 */

const FILE = path.join(process.cwd(), 'data', 'db.json');

/** Every top-level key the state can hold. Missing keys fall back to a default
 *  so a collection that has never been written still reads cleanly. */
const COLLECTIONS = [
  'dashboardStats', 'settings', 'admin', 'sessions', 'accounts', 'users',
  'deposits', 'withdrawals', 'orders', 'mining', 'investments',
  'miningWithdrawals', 'investmentWithdrawals', 'notifications', 'boosts',
  'pushSubscriptions', 'activity', 'passkeys',
];

const ARRAY_DEFAULTS = new Set([
  'users', 'deposits', 'withdrawals', 'orders', 'mining', 'investments',
  'miningWithdrawals', 'investmentWithdrawals', 'notifications', 'boosts',
  'pushSubscriptions', 'activity', 'accounts', 'passkeys',
]);

const col = (k) => `col:${k}`;

/* ---------------- seeding ---------------- */

/** Local-development admin password, used only when ADMIN_PASSWORD is unset
 *  and we are not running in production. Override it with the env var. */
const DEV_ADMIN_PASSWORD = 'admin123';

function adminPassword() {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  if (process.env.NODE_ENV === 'production') {
    // Never ship a guessable admin password. A random one keeps the site up and
    // the account unguessable; set ADMIN_PASSWORD to control it yourself.
    const generated = crypto.randomBytes(18).toString('base64url');
    console.warn(
      '[db] ADMIN_PASSWORD is not set. Generated a random admin password for this instance. ' +
        'Set ADMIN_PASSWORD in your environment to choose your own.',
    );
    return generated;
  }
  return DEV_ADMIN_PASSWORD;
}

/** Cheap fingerprint of a password, for spotting a changed ADMIN_PASSWORD
 *  without paying for a full scrypt verify on every request. */
function passwordMarker(pw) {
  return crypto.createHash('sha256').update(String(pw)).digest('hex');
}

/** The admin record: hashed password plus the marker described above. */
function freshAdmin() {
  const pw = adminPassword();
  return { ...hashPassword(pw), marker: passwordMarker(pw), token: null };
}

/** Fresh state from data/seed.json, with the admin record and any collection
 *  the seed predates filled in so every key always exists. */
function seedState() {
  const state = JSON.parse(JSON.stringify(seed));
  state.admin = freshAdmin();
  state.sessions = {};
  for (const k of COLLECTIONS) {
    if (state[k] === undefined) state[k] = ARRAY_DEFAULTS.has(k) ? [] : {};
  }
  return state;
}

/** Upgrade a stored admin record that still holds a plaintext `password`
 *  (the old shape) into a hashed one. Returns true if it changed. */
function hashLegacyAdmin(state) {
  const admin = state.admin;
  if (!admin || admin.hash || !admin.password) return false;
  const { salt, hash } = hashPassword(admin.password);
  state.admin = { salt, hash, marker: admin.marker, token: admin.token ?? null };
  return true;
}

/**
 * Keep the stored admin hash in step with ADMIN_PASSWORD. The env var is the
 * source of truth; the stored value is a scrypt hash, so a changed variable is
 * re-hashed here and written once. No-op when the var is unset, because the
 * production fallback generates a fresh random password per call.
 */
function syncAdminPassword(state) {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw || !state.admin) return false;
  const marker = passwordMarker(pw);
  if (state.admin.marker === marker) return false;
  state.admin = { ...state.admin, ...hashPassword(pw), marker };
  return true;
}

/**
 * Apply every in-place admin upgrade. Returns true if anything needs writing.
 *
 * Both checks must run on every pass, so their results are combined with `|`
 * rather than `||` — a short-circuit would skip the ADMIN_PASSWORD sync on the
 * same request that hashed a legacy plaintext record, leaving the stored hash
 * one password change behind.
 */
function upgradeAdmin(state) {
  const hashed = hashLegacyAdmin(state);
  const synced = syncAdminPassword(state);
  return hashed || synced;
}

/* ---------------- file backend (local dev) ---------------- */

function readFile() {
  let state;
  try {
    state = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch (e) {
    return seedState();
  }
  if (upgradeAdmin(state)) writeFile(state);
  return state;
}

function writeFile(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

/* ---------------- Neon backend (deployed) ---------------- */

let client = null;
let tableReady = false;

function sql() {
  // Lazily constructed: a bare neon() throws when DATABASE_URL is missing,
  // which would crash `next build` where no database is configured.
  //
  // `cache: 'no-store'` is LOAD-BEARING — do not remove it. Next.js patches
  // global fetch and files every request in its Data Cache, and this driver
  // sends its SQL over fetch. Without this option the *query responses* get
  // cached: the SQL text is identical on every read, so the cache key is
  // identical too, and every read after the first returns the rows from
  // whenever the entry was written. The admin's new deposit address reached the
  // database correctly and was then never read back — which is the whole
  // "the address never changes" bug. It only reproduces in a production build;
  // `next dev` does not persist that cache, so it looks fine locally and breaks
  // on Vercel.
  if (!client) {
    client = neon(process.env.DATABASE_URL, { fetchOptions: { cache: 'no-store' } });
  }
  return client;
}

async function ensureTable() {
  if (tableReady) return;
  await sql()`
    CREATE TABLE IF NOT EXISTS app_state (
      key        text PRIMARY KEY,
      data       jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )`;
  tableReady = true;
}

/** Serialised snapshot of each collection, keyed by the state object. A WeakMap
 *  keeps it scoped to the exact object readDb() returned for this request — the
 *  routes mutate that object in place, so writeDb() can see what changed. */
const SNAPSHOTS = new WeakMap();

function snapshot(state) {
  const s = {};
  for (const k of COLLECTIONS) s[k] = JSON.stringify(state[k] ?? null);
  return s;
}

/* ---------------- the interface every route uses ---------------- */

/**
 * Read the whole state.
 *
 * Deliberately not memoised. State that the admin edits at runtime must not be
 * held in anything that can outlive the request that read it; the cost of
 * leaving it plain is one query per call, which is the right trade here. (The
 * production staleness this used to be blamed for actually came from fetch
 * caching in sql() above — see the note there.)
 */
export async function readDb() {
  if (!process.env.DATABASE_URL) return readFile();

  await ensureTable();
  const rows = await sql()`SELECT key, data FROM app_state WHERE key = ANY(${COLLECTIONS.map(col)})`;

  const state = seedState();
  for (const r of rows) {
    const key = r.key.startsWith('col:') ? r.key.slice(4) : r.key;
    // Skip null so a collection that was never written keeps its seed default.
    if (COLLECTIONS.includes(key) && r.data != null) state[key] = r.data;
  }

  if (rows.length === 0) {
    // First run against an empty database — lay down the seed. No snapshot yet,
    // so writeDb() writes every collection.
    await writeDb(state);
  } else {
    // A changed ADMIN_PASSWORD is applied on the first request after the env
    // var moves. The snapshot is taken first so this writes only `admin`.
    SNAPSHOTS.set(state, snapshot(state));
    if (upgradeAdmin(state)) await writeDb(state);
  }

  SNAPSHOTS.set(state, snapshot(state));
  return state;
}

export async function writeDb(data) {
  if (!process.env.DATABASE_URL) return writeFile(data);

  await ensureTable();
  const snap = SNAPSHOTS.get(data);
  const writes = [];
  for (const k of COLLECTIONS) {
    const serialised = JSON.stringify(data[k] ?? null);
    if (snap && snap[k] === serialised) continue; // unchanged — skip
    writes.push(upsert(k, serialised));
  }
  if (writes.length) await Promise.all(writes);
}

/**
 * Write one collection, unconditionally.
 *
 * writeDb() diffs against the snapshot readDb() left behind, which makes it a
 * silent no-op when that snapshot already matches — and a caller cannot tell
 * the difference, because it still returns normally. That is fine for the
 * best-effort background writes, but wrong for a save the user is watching: an
 * admin who edits a deposit address must either see it stored or see an error.
 * This always upserts, and reports whether the row reads back with the value.
 */
export async function writeCollection(name, value) {
  if (!COLLECTIONS.includes(name)) throw new Error(`Unknown collection: ${name}`);

  if (!process.env.DATABASE_URL) {
    const state = readFile();
    state[name] = value;
    writeFile(state);
    return true;
  }

  await ensureTable();
  const serialised = JSON.stringify(value ?? null);
  await upsert(name, serialised);

  const [row] = await sql()`SELECT data FROM app_state WHERE key = ${col(name)}`;
  return JSON.stringify(row?.data ?? null) === serialised;
}

function upsert(name, serialised) {
  return sql()`
    INSERT INTO app_state (key, data, updated_at)
    VALUES (${col(name)}, ${serialised}::jsonb, now())
    ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`;
}

/**
 * Is this request from a signed-in admin?
 *
 * ASYNC — and that matters. Always `await isAuthed(req)`, and never trust a
 * truthiness check on a bare call: a forgotten `await` makes it `!Promise`,
 * which is always false.
 */
export async function isAuthed(req) {
  const token = req.cookies.get('admin_session')?.value;
  if (!token) return false;
  const db = await readDb();
  return !!(db.admin && token === db.admin.token);
}
