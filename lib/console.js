/**
 * The operations console's address, in one place.
 *
 * The console used to live at /admin. That is the first path anyone probes on
 * a site, so the page was found and its login form offered up before anybody
 * had to guess anything. It now sits at a path with a random segment in it.
 *
 * The string below MUST match the folder name under app/ — Next.js routes on
 * the directory, and nothing can change that from here. So this constant is a
 * copy of the directory name, not the source of truth for it. Rename the
 * folder and this line together; everything else reads this.
 *
 * `middleware.js` imports it too, and that is the file that actually enforces
 * the hiding: /admin is 404'd, /api/admin only answers the console, and every
 * response under here carries X-Robots-Tag: noindex.
 *
 * This is obscurity, and obscurity is not the lock. The lock is `isAuthed` in
 * lib/db.js — the admin session cookie, checked by every route under
 * app/api/admin. What this buys is that nobody stumbles in, and that a crawler
 * cannot put the login form in a search result.
 */
export const CONSOLE_PATH = '/console-006cd676';

/** The API namespace, which stays where it was and is guarded by middleware. */
export const CONSOLE_API = '/api/admin';

/** True for the console's own pages — the login screen included. */
export function isConsoleRoute(pathname) {
  const p = String(pathname || '');
  return p === CONSOLE_PATH || p.startsWith(`${CONSOLE_PATH}/`);
}
