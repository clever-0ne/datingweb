import webpush from 'web-push';

/**
 * Web Push for the installed PWA.
 *
 * The in-app notification and the push are two halves of the same event: the
 * notification is what the bell shows, the push is what wakes a closed app.
 * They are sent separately because the push is a network call that can fail or
 * be slow — it must never hold up a database write, and a dead subscription
 * must never fail the transaction that triggered it.
 *
 * Server-only. Without VAPID keys configured every function here is a no-op,
 * so local development needs no push setup.
 */

// No NEXT_PUBLIC_ prefix on purpose: this file is server-only, and the browser
// gets the public key from /api/push/config at runtime. A NEXT_PUBLIC_ name
// would be inlined at build time, so a key added after the build would never
// reach the client.
const PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@teslacapital.io';

export const pushConfigured = Boolean(PUBLIC_KEY && PRIVATE_KEY);

/** The half of the keypair the browser is allowed to see. */
export function pushPublicKey() {
  return pushConfigured ? PUBLIC_KEY : '';
}

/**
 * The pseudo-user the admin console's subscriptions are filed under.
 *
 * The console signs in with a single shared password and has no user record
 * (see lib/db.js), so there is no id to key on. Real user ids are `TC-…`, which
 * can never equal this, so the two audiences cannot collide in
 * `db.pushSubscriptions` — a subscription is either a user's or the console's.
 */
export const ADMIN_AUDIENCE = 'admin';

let ready = false;
function configure() {
  if (!pushConfigured || ready) return pushConfigured;
  try {
    webpush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY);
    ready = true;
  } catch {
    // Malformed keys, wrong lengths — treat as unconfigured rather than
    // crashing every route that tries to notify.
    return false;
  }
  return true;
}

/** Every subscription row in the db that belongs to one user. */
function subscriptionsFor(db, userId) {
  return (db.pushSubscriptions || []).filter((s) => s.userId === userId);
}

/**
 * Add or refresh a device subscription. The endpoint identifies the browser, so
 * re-subscribing the same device updates its keys instead of stacking a second
 * row that would receive every push twice.
 */
export function saveSubscription(db, userId, subscription, userAgent) {
  const endpoint = String(subscription?.endpoint || '');
  if (!endpoint) return null;

  db.pushSubscriptions = db.pushSubscriptions || [];
  const existing = db.pushSubscriptions.find((s) => s.endpoint === endpoint);

  if (existing) {
    existing.userId = userId;
    existing.keys = subscription.keys || existing.keys;
    existing.userAgent = userAgent || existing.userAgent;
    existing.updatedAt = new Date().toISOString();
    return existing;
  }

  const row = {
    id: `PS-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    userId,
    endpoint,
    keys: subscription.keys || null,
    userAgent: userAgent || null,
    createdAt: new Date().toISOString(),
  };
  db.pushSubscriptions.push(row);
  return row;
}

export function removeSubscription(db, userId, endpoint) {
  const before = (db.pushSubscriptions || []).length;
  db.pushSubscriptions = (db.pushSubscriptions || []).filter(
    (s) => !(s.userId === userId && s.endpoint === String(endpoint || '')),
  );
  return before !== db.pushSubscriptions.length;
}

/**
 * Mirror a notification to the user's devices.
 *
 * Call this AFTER the writeDb() that stored the notification — never before, or
 * a failed write would have already pushed a message about something that did
 * not happen. It never throws: push is best-effort by nature, and a push
 * failure must not roll back a completed transaction.
 *
 * Subscriptions the push service reports as gone (404/410) are deleted, which
 * is how uninstalled apps get cleaned up rather than retried forever. That
 * deletion only touches the in-memory copy — it is persisted by whatever
 * writeDb() the user's next action performs. Until then the row is retried,
 * which is harmless: the push service just answers 410 again.
 */
export async function deliverPush(db, userId, { title, body, url = '/dashboard' }) {
  if (!configure()) return { sent: 0, skipped: 'not configured' };

  const targets = subscriptionsFor(db, userId);
  if (!targets.length) return { sent: 0, skipped: 'no subscriptions' };

  const payload = JSON.stringify({ title, body, url, at: new Date().toISOString() });
  const dead = [];
  let sent = 0;

  await Promise.all(
    targets.map(async (row) => {
      try {
        await webpush.sendNotification({ endpoint: row.endpoint, keys: row.keys }, payload);
        sent++;
      } catch (err) {
        if (err?.statusCode === 404 || err?.statusCode === 410) dead.push(row.endpoint);
        // Anything else (network, 5xx, rate limit) is transient — leave the
        // subscription alone so the next event can try again.
      }
    }),
  );

  if (dead.length) {
    db.pushSubscriptions = (db.pushSubscriptions || []).filter((s) => !dead.includes(s.endpoint));
  }

  return { sent, removed: dead.length };
}

/**
 * Mirror an event to every device the admin console is signed in on.
 *
 * Same contract as deliverPush, and for the same reason: call it AFTER the
 * writeDb() that recorded the event, never before, and never let a push failure
 * fail the request that triggered it. Every caller so far is a user action that
 * has already succeeded by the time this runs — a dead push service must not
 * turn a completed deposit into a 500.
 *
 * `url` defaults to the console, because every event this carries is something
 * an admin acts on there. Tapping the notification lands on the queue.
 */
export async function deliverAdminPush(db, { title, body, url = '/admin' }) {
  return deliverPush(db, ADMIN_AUDIENCE, { title, body, url });
}
