import crypto from 'crypto';
import { WITHDRAWAL_FEE_PCT, MAX_CODE_ATTEMPTS } from './plans';
import { round2, fmtUsd } from './format';
import { pushNotification } from './notifications';

/**
 * The two-step payout, shared by mining contracts and investment plans.
 *
 *   1. request   the user claims everything matured and unclaimed
 *   2. approval  an admin approves; the code lands in the user's notifications
 *   3. confirm   the user returns the code and the money moves
 *
 * The whole point of the shape is that no balance changes until step 3. A
 * request that is never confirmed leaves the user's money exactly where it was,
 * so a mis-click cannot move funds and an approved-but-unconfirmed payout can
 * never be paid twice.
 *
 * Server-only: it generates codes with node:crypto.
 */

export const MINING_PAYOUTS = 'miningWithdrawals';
export const INVESTMENT_PAYOUTS = 'investmentWithdrawals';

/** A failure that maps directly onto an HTTP response. */
export class PayoutError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = 'PayoutError';
    this.status = status;
  }
}

function generateCode() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, '0');
}

export function feeFor(gross) {
  return round2(Number(gross) * (WITHDRAWAL_FEE_PCT / 100));
}

/**
 * Constant-time comparison, so the time taken to reject a wrong code does not
 * leak how many leading digits were right.
 */
export function codesMatch(a, b) {
  const left = Buffer.from(String(a ?? ''));
  const right = Buffer.from(String(b ?? ''));
  if (left.length !== right.length || left.length === 0) return false;
  return crypto.timingSafeEqual(left, right);
}

/* ------------------------------------------------------------------ *
 * step 1 — open a request
 * ------------------------------------------------------------------ */

/**
 * Claim every withdrawable item for one user.
 *
 * `items` is the caller's already-filtered list of matured, unclaimed rows and
 * `grossOf` reads the payout value from one — mining pays `totalReturn`,
 * investments pay `returnAmount`. Kept as a parameter so the payout rules live
 * here while the definition of "matured" stays with each product.
 *
 * THE GAS FEE IS CHARGED HERE, up front, before any admin sees the request. It
 * comes out of the user's own balance — it is never a payment sent anywhere —
 * and the full gross is credited on release, so the fee is a visible line in
 * the ledger from the moment the request exists.
 *
 * The consequence is that a declined request has to refund it (see
 * decideRequest) or a rejection would quietly cost the user money. The
 * balance check below is the other consequence: a user who cannot cover the
 * fee cannot open a request at all.
 *
 * Throws PayoutError when there is nothing to claim, a request is already open,
 * or the balance will not cover the fee — so the caller never has to re-derive
 * those rules.
 */
export function createRequest(db, { collection, idPrefix, userId, items, grossOf }) {
  const open = (db[collection] || []).find(
    (w) => w.userId === userId && (w.status === 'pending' || w.status === 'approved'),
  );
  if (open) {
    throw new PayoutError('You already have a withdrawal awaiting approval.');
  }

  if (!items.length) {
    throw new PayoutError('Nothing has matured yet — check back once your term ends.');
  }

  const user = (db.users || []).find((u) => u.id === userId);
  if (!user) throw new PayoutError('Account not found.', 401);

  const itemIds = items.map((i) => i.id);
  const gross = round2(items.reduce((sum, i) => sum + Number(grossOf(i)), 0));
  const fee = feeFor(gross);

  if (Number(user.balance) < fee) {
    throw new PayoutError(
      `You need ${fmtUsd(fee)} in your balance to cover the gas fee on this withdrawal.`,
    );
  }

  user.balance = round2(Number(user.balance) - fee);

  const payout = {
    id: `${idPrefix}-${Date.now()}`,
    userId,
    itemIds,
    gross,
    fee,
    net: round2(gross - fee),
    code: generateCode(),
    attempts: 0,
    status: 'pending',
    createdAt: new Date().toISOString(),
    // Two timestamps rather than a boolean: the ledger needs to show both the
    // charge and any refund, and derive "is the fee currently held" from them.
    feeChargedAt: new Date().toISOString(),
    feeRefundedAt: null,
  };

  db[collection] = db[collection] || [];
  db[collection].push(payout);
  return payout;
}

/** The stored request without its code — what it is safe to send to a user. */
export function redact(payout) {
  const { code, ...safe } = payout;
  return safe;
}

/* ------------------------------------------------------------------ *
 * step 2 — the user returns the code
 * ------------------------------------------------------------------ */

/**
 * Release an approved payout. This is the only function in the codebase that
 * moves payout money into a balance.
 *
 * The guards run in a deliberate order: already-paid, then rejected, then
 * not-yet-approved, then locked out, and only then the code comparison. Getting
 * that order wrong would let a rejected request be confirmed with a stale code.
 */
export function confirmRequest(db, { collection, userId, id, code }) {
  const payout = (db[collection] || []).find((w) => w.id === String(id || '') && w.userId === userId);
  if (!payout) throw new PayoutError('Withdrawal request not found.', 404);

  if (payout.status === 'released') {
    throw new PayoutError('This withdrawal has already been paid out.');
  }
  if (payout.status === 'rejected') {
    throw new PayoutError('This request was rejected.');
  }
  if (payout.status !== 'approved') {
    throw new PayoutError('This request is still awaiting admin approval.');
  }
  if ((Number(payout.attempts) || 0) >= MAX_CODE_ATTEMPTS) {
    throw new PayoutError('Too many incorrect codes. Ask an admin to reissue this request.', 429);
  }

  if (!codesMatch(code, payout.code)) {
    payout.attempts = (Number(payout.attempts) || 0) + 1;
    const left = MAX_CODE_ATTEMPTS - payout.attempts;
    throw new PayoutError(
      left > 0
        ? `Incorrect code. ${left} attempt${left === 1 ? '' : 's'} left.`
        : 'Too many incorrect codes. Ask an admin to reissue this request.',
    );
  }

  const user = (db.users || []).find((u) => u.id === userId);
  if (!user) throw new PayoutError('Account not found.', 401);

  // The gross, not the net: the gas fee was already taken from the balance when
  // the request was opened, so crediting net here would charge it twice.
  user.balance = round2(Number(user.balance) + Number(payout.gross));
  payout.status = 'released';
  payout.releasedAt = new Date().toISOString();

  const notification = pushNotification(db, userId, {
    title: 'Payout released',
    body: `${payout.id} cleared — ${fmtUsd(payout.gross)} was added to your main balance. The ${fmtUsd(payout.fee)} gas fee was charged when you submitted the request.`,
    kind: 'success',
  });

  // The notification travels back to the caller rather than being delivered
  // here: every function in this file is synchronous and owns no I/O, and the
  // push must happen after the caller's writeDb() has committed the release.
  return { payout, balance: user.balance, notification };
}

/* ------------------------------------------------------------------ *
 * admin review queue
 * ------------------------------------------------------------------ */

/**
 * Every request in one payout stream, newest first, with the requesting user
 * joined on. Both queues share this shape so the admin console renders them
 * with one component. The code is stripped — an admin never needs to read it
 * out, and leaving it in the response would leak the second factor.
 */
export function buildAdminQueue(db, collection, { label, itemLabel }) {
  const users = db.users || [];
  return (db[collection] || [])
    .map((w) => {
      const user = users.find((u) => u.id === w.userId);
      return {
        id: w.id,
        userId: w.userId,
        userName: user?.name || 'Unknown',
        userEmail: user?.email || '',
        kind: label,
        itemLabel,
        items: (w.itemIds || []).length,
        itemIds: w.itemIds || [],
        gross: Number(w.gross) || 0,
        fee: Number(w.fee) || 0,
        net: Number(w.net) || 0,
        status: w.status,
        attempts: Number(w.attempts) || 0,
        createdAt: w.createdAt,
        approvedAt: w.approvedAt || null,
        releasedAt: w.releasedAt || null,
        rejectReason: w.rejectReason || null,
        // The fee moves at request time, not at approval, so the console shows
        // whether it is currently held rather than assuming it comes out of the
        // payout the admin is approving.
        feeChargedAt: w.feeChargedAt || null,
        feeRefundedAt: w.feeRefundedAt || null,
      };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/* ------------------------------------------------------------------ *
 * admin decision
 * ------------------------------------------------------------------ */

/**
 * An admin's approve/reject decision, with the guards that stop one being
 * replayed: a released payout is final, and anything no longer pending has
 * already been decided. Returns `{ payout, notification }` for the caller to
 * push once its writeDb() has landed.
 */
export function adminDecide(db, { collection, id, status, reason, label }) {
  const payout = (db[collection] || []).find((w) => w.id === id);
  if (!payout) throw new PayoutError('Request not found.', 404);

  if (!['approved', 'rejected'].includes(status)) {
    throw new PayoutError('Status must be approved or rejected.');
  }
  if (payout.status === 'released') {
    throw new PayoutError('This payout has already been released.');
  }
  if (payout.status !== 'pending') {
    throw new PayoutError(`This request is already ${payout.status}.`);
  }

  return decideRequest(db, {
    payout,
    status,
    reason: String(reason || '').trim() || undefined,
    label,
  });
}

/**
 * Apply an admin's decision. Approving only records the decision and hands the
 * user their code — it moves no money, so an approval can be reversed safely
 * right up until the user confirms.
 *
 * Returns `{ payout, notification }` so the caller can push after its own
 * writeDb(). `notification` is null when the decision was already in effect.
 */
export function decideRequest(db, { payout, status, reason, label }) {
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    throw new PayoutError('Invalid status.');
  }
  if (payout.status === status) return { payout, notification: null };

  payout.status = status;
  let notification = null;

  if (status === 'approved') {
    payout.approvedAt = new Date().toISOString();
    // A fresh code and a clean slate — the previous attempts were against a
    // decision that no longer stands.
    payout.code = generateCode();
    payout.attempts = 0;
    notification = pushNotification(db, payout.userId, {
      title: `${label} payout approved`,
      body: `Your verification code is ${payout.code}. Enter it to release ${fmtUsd(payout.gross)} to your main balance. The ${fmtUsd(payout.fee)} gas fee was already charged against your balance when you submitted.`,
      kind: 'success',
    });
  } else if (status === 'rejected') {
    payout.rejectedAt = new Date().toISOString();
    payout.rejectReason = reason || null;

    // Give the gas fee back. It was taken when the request was opened, so
    // without this a declined request would have cost the user real money for
    // a payout they never received.
    const fee = Number(payout.fee) || 0;
    const refunded = fee > 0 && payout.feeChargedAt && !payout.feeRefundedAt;
    if (refunded) {
      const user = (db.users || []).find((u) => u.id === payout.userId);
      if (user) user.balance = round2(Number(user.balance) + fee);
      payout.feeRefundedAt = new Date().toISOString();
    }

    notification = pushNotification(db, payout.userId, {
      title: `${label} payout declined`,
      body: `${reason || 'Your payout request was declined.'} ${
        refunded ? `The ${fmtUsd(fee)} gas fee has been returned to your balance. ` : ''
      }No funds were moved, and your items can be withdrawn again.`,
      kind: 'error',
    });
  }

  return { payout, notification };
}
