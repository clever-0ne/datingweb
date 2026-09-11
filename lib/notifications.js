/**
 * In-app notifications. Stored per user in `db.notifications` and read by the
 * bell in AppChrome. They ride along on /api/wallet so any mutation that
 * refreshes the wallet — including a mining payout — refreshes the bell too.
 */

/** Append a notification for one user. The caller owns the writeDb(). */
export function pushNotification(db, userId, { title, body, kind = 'info' }) {
  db.notifications = db.notifications || [];
  const notification = {
    id: `N-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    userId,
    title,
    body,
    kind,
    read: false,
    createdAt: new Date().toISOString(),
  };
  db.notifications.push(notification);
  return notification;
}

export function buildNotifications(db, userId) {
  return (db.notifications || [])
    .filter((n) => n.userId === userId)
    .map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      kind: n.kind || 'info',
      read: !!n.read,
      createdAt: n.createdAt,
    }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}
