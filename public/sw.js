/**
 * Tesla Capital service worker — push notifications and a minimal offline shell.
 *
 * Deliberately dependency-free and served from /public so it is not bundled.
 * Scope is the site root, which is what allows it to control every page.
 */

const CACHE = 'tesla-capital-v1';
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', (event) => {
  // Take over immediately rather than waiting for every tab to close.
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll([OFFLINE_URL]).catch(() => undefined)),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

/**
 * Network-first for navigations, falling back to the offline page. Everything
 * else is left entirely alone — caching API responses here would serve stale
 * balances, which is worse than being offline.
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL).then((r) => r || Response.error())),
    );
  }
});

/* ---------------- push ---------------- */

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: 'Tesla Capital', body: event.data ? event.data.text() : '' };
  }

  const title = payload.title || 'Tesla Capital';
  const options = {
    body: payload.body || '',
    icon: '/assets/coins/btc.png',
    badge: '/assets/coins/btc.png',
    // `tag` collapses repeats of the same event into one notification instead
    // of stacking them; `renotify` still alerts on each new one.
    tag: payload.at || 'tesla-capital',
    renotify: true,
    data: { url: payload.url || '/dashboard' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data?.url || '/dashboard';

  // Focus an existing tab on this origin rather than opening a duplicate.
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (new URL(client.url).origin === self.location.origin && 'focus' in client) {
          client.navigate(target);
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    }),
  );
});
