/**
 * Money formatting for server-side code — route handlers build notification
 * bodies and response payloads, and they need the same "$1,234.56" the client
 * shows. Dependency-free so it is safe to import anywhere.
 */

export function fmtUsd(n) {
  return '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Round to cents, avoiding the 0.1 + 0.2 float drift on money math. */
export function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}
