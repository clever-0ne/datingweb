'use client';

/**
 * A clock that agrees with the server.
 *
 * Maturity is decided on the server from the server's own clock, because that
 * is the only clock the user cannot edit. The UI, though, counted down against
 * `Date.now()` — the device's clock — so a phone with its date moved forward
 * would show "Matured" on a contract the server still considered running. The
 * two halves of the same screen contradicted each other.
 *
 * So the wallet response carries the server's time and the client measures the
 * difference once per fetch. Everything that displays a duration reads through
 * `now()` instead of `Date.now()`, and the screen agrees with the server no
 * matter what the device's clock says.
 *
 * This aligns the DISPLAY only. The server remains the sole authority on
 * whether a contract has matured, so moving a device clock cannot unlock a
 * payout early — it just stops the countdown from pretending otherwise.
 */

let offset = 0;

/** Anchor the local clock to the server's. Called on every wallet fetch. */
export function syncClock(serverNow) {
  const server = Number(serverNow);
  if (Number.isFinite(server) && server > 0) offset = server - Date.now();
}

/** The current time, corrected to the server's clock. */
export function now() {
  return Date.now() + offset;
}
