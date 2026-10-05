/** Hard-delete a user and every record tied to them. Caller owns writeDb(). */

// Every collection keyed by userId. Anything added later that stores per-user
// records belongs here too, or a deleted user's data outlives them.
const USER_KEYED = [
  'deposits', 'withdrawals', 'orders', 'mining', 'investments',
  'miningWithdrawals', 'investmentWithdrawals', 'miningPayouts', 'investmentPayouts',
  'notifications', 'boosts', 'pushSubscriptions', 'activity',
];

/**
 * Remove a user and everything that identifies them: profile, login account,
 * sessions (signs them out everywhere), passkeys, pending login codes,
 * password-reset links, money records, notifications and push devices.
 */
export function purgeUser(db, userId) {
  const accounts = (db.accounts || []).filter((a) => a.userId === userId);
  const accountIds = new Set(accounts.map((a) => a.id));
  const emails = new Set(accounts.map((a) => String(a.email || '').toLowerCase()));
  const user = (db.users || []).find((u) => u.id === userId);
  if (user?.email) emails.add(String(user.email).toLowerCase());

  const payoutIds = new Set(
    [...(db.miningWithdrawals || []), ...(db.investmentWithdrawals || []),
     ...(db.miningPayouts || []), ...(db.investmentPayouts || [])]
      .filter((p) => p.userId === userId)
      .map((p) => p.id),
  );

  db.users = (db.users || []).filter((u) => u.id !== userId);
  db.accounts = (db.accounts || []).filter((a) => !accountIds.has(a.id));
  for (const k of USER_KEYED) {
    if (Array.isArray(db[k])) db[k] = db[k].filter((r) => r.userId !== userId);
  }

  db.passkeys = (db.passkeys || []).filter((p) => !accountIds.has(p.accountId));
  for (const map of [db.sessions, db.loginChallenges]) {
    if (!map || typeof map !== 'object') continue;
    for (const [k, v] of Object.entries(map)) if (accountIds.has(v?.accountId)) delete map[k];
  }

  if (db.withdrawOtps) delete db.withdrawOtps[userId];
  if (db.pendingSignups) {
    for (const [k, p] of Object.entries(db.pendingSignups)) if (emails.has(String(p?.email || '').toLowerCase())) delete db.pendingSignups[k];
  }
  if (Array.isArray(db.subscribers)) {
    db.subscribers = db.subscribers.filter((s) => !emails.has(String(s.email || '').toLowerCase()));
  }

  if (db.passwordResets) {
    db.passwordResets = db.passwordResets.filter((r) => !emails.has(String(r.email || '').toLowerCase()));
  }
  if (db.withdrawalCodes) {
    db.withdrawalCodes = db.withdrawalCodes.filter((c) => !payoutIds.has(c.payoutId));
  }
}
