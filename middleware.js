import { NextResponse } from 'next/server';
import { CONSOLE_PATH, CONSOLE_API } from '@/lib/console';

/**
 * Keeps the operations console off the map.
 *
 * Three jobs, in the order they matter:
 *
 *   1. /admin is gone. It was the old address and it is the first path anyone
 *      probes, so it answers 404 rather than redirecting — a redirect would
 *      hand the new address to exactly the person who guessed the old one.
 *      The console's own paths are untouched.
 *
 *   2. /api/admin only answers the console. Every route under it already
 *      requires the admin session cookie (`isAuthed` in lib/db.js), so this is
 *      a second fence, not the lock: it rejects a request that did not come
 *      from a console page, which means a discovered endpoint cannot be driven
 *      by hand from a terminal.
 *
 *      Read the limitation honestly. Origin and Referer are attacker-controlled
 *      headers, so this stops curl and a curious visitor, not someone who has
 *      decided to lie. The session cookie is what actually protects the data.
 *
 *   3. Nothing under here is indexed. X-Robots-Tag is set on the response
 *      rather than in page metadata because both console pages are client
 *      components, which cannot export `metadata` — and because a header also
 *      covers the JSON API, which has no <head> to put a tag in.
 *
 * Runs on the Edge runtime, so it must not reach for the database. It does not:
 * nothing here reads state, and the cookie itself is only ever *checked for
 * presence* — the value is verified against the database by the route handler.
 */

/** The whole of the retired address's response. Says nothing about what used
 *  to be here, which is the point — it reads as any other dead link. */
const NOT_FOUND_HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>404 — Not found</title></head>
<body style="margin:0;display:grid;place-items:center;min-height:100vh;background:#0a0e18;color:#aab6c9;font:400 15px/1.6 system-ui,sans-serif">
<p>404 — this page does not exist.</p></body></html>`;

/** Does this request look like it came from a console page? */
function fromConsole(req) {
  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');
  const here = req.nextUrl.origin;

  if (origin && origin !== here) return false;

  if (referer) {
    try {
      const ref = new URL(referer);
      if (ref.origin !== here) return false;
      if (!ref.pathname.startsWith(CONSOLE_PATH)) return false;
    } catch {
      return false;
    }
  }

  // No Origin and no Referer: a same-origin GET from the browser omits both on
  // some navigations, so this is not on its own evidence of anything. Allow it
  // and let the session check decide — /api/admin/session is called this way.
  return true;
}

/** Headers every console response carries, page or JSON alike. */
function harden(res) {
  res.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  res.headers.set('Referrer-Policy', 'no-referrer');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  return res;
}

export function middleware(req) {
  const { pathname } = req.nextUrl;

  // 1. The retired address. Not a redirect — a redirect is a map.
  //
  // It carries a real body rather than an empty 404. A response with no content
  // at all is treated by browsers as a failed navigation, so the visitor gets a
  // network error instead of a page — and a CDN in front of this may refuse to
  // cache it. This is the shortest thing that still behaves like a 404.
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return harden(
      new NextResponse(NOT_FOUND_HTML, {
        status: 404,
        headers: { 'content-type': 'text/html; charset=utf-8' },
      })
    );
  }

  // 2. The API, reachable only from a console page.
  if (pathname.startsWith(`${CONSOLE_API}/`)) {
    if (!fromConsole(req)) {
      return harden(
        NextResponse.json({ ok: false, error: 'Not found.' }, { status: 404 })
      );
    }
    return harden(NextResponse.next());
  }

  // 3. The console itself — hidden from crawlers, not from its own user.
  if (pathname.startsWith(CONSOLE_PATH)) {
    return harden(NextResponse.next());
  }

  return NextResponse.next();
}

/**
 * Scoped to the four prefixes this file has an opinion about. Matching every
 * request would put middleware in front of the whole site — static assets and
 * public pages included — to do nothing.
 *
 * The third entry is CONSOLE_PATH written out longhand, and it has to be: the
 * build reads these strings statically, so a template literal here is a build
 * error rather than a value. The same is true of the folder under app/. Three
 * copies of one path is two too many, but there is no fourth option — say the
 * word and I will rename it everywhere at once instead.
 */
export const config = {
  matcher: [
    '/admin',
    '/admin/:path*',
    '/api/admin/:path*',
    '/console-006cd676/:path*',
  ],
};
