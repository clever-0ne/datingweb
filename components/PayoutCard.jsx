'use client';

import { useState } from 'react';
import { Clock, ShieldCheck } from 'lucide-react';
import { fmtMoney } from '@/lib/wallet';
import { WITHDRAWAL_FEE_PCT } from '@/lib/plans';

/**
 * One payout request, shared by the mining and investment dashboards — the two
 * use the same format, so they use the same card.
 *
 * The code field only appears once an admin has approved: before that the
 * six-digit code has never left the server, and after it the user reads it from
 * their notifications.
 */

const PAYOUT_STATUS = {
  pending: { label: 'Awaiting approval', cls: 'pill-yel' },
  approved: { label: 'Enter your code', cls: 'pill-pri' },
  released: { label: 'Released', cls: 'pill-sec' },
  rejected: { label: 'Rejected', cls: 'pill-red' },
};

const fmtDay = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

function Row({ k, v }) {
  return (
    <div className="flex justify-between">
      <span className="mut">{k}</span>
      <span className="font-medium hi">{v}</span>
    </div>
  );
}

export default function PayoutCard({ w, onConfirm, itemLabel = 'contract' }) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const status = PAYOUT_STATUS[w.status] || PAYOUT_STATUS.pending;

  const count = w[`${itemLabel}s`] ?? w.items ?? 0;

  const submit = async () => {
    setBusy(true);
    setErr(null);
    const d = await onConfirm(w.id, code.trim());
    setBusy(false);
    if (d?.ok) setCode('');
    else setErr(d?.error || 'Could not release the payout.');
  };

  return (
    <div className="card flex flex-col">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-mono text-sm font-semibold hi">{w.id}</h3>
          <p className="text-xs mut">
            {count} {itemLabel}{count === 1 ? '' : 's'} · requested {fmtDay(w.createdAt)}
          </p>
        </div>
        <span className={`pill ${status.cls}`}>{status.label}</span>
      </div>

      <div className="space-y-2 text-sm">
        <Row k="Gross return" v={fmtMoney(w.gross)} />
        <Row
          k={`Gas fee (${WITHDRAWAL_FEE_PCT}%)${w.feeRefundedAt ? ' — refunded' : ' — charged on request'}`}
          v={
            w.feeRefundedAt ? (
              <span className="grn">{fmtMoney(w.fee)} back</span>
            ) : (
              <span style={{ color: 'var(--bad-text)' }}>−{fmtMoney(w.fee)}</span>
            )
          }
        />
        <Row
          k={w.status === 'released' ? 'Credited to balance' : 'Credited on release'}
          v={<span className="grn">{fmtMoney(w.gross)}</span>}
        />
      </div>

      {w.status === 'approved' && (
        <div className="mt-4 rounded-xl border p-3" style={{ borderColor: 'rgba(47,109,255,.3)', background: 'rgba(10,84,255,.07)' }}>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium blut">
            <ShieldCheck size={13} /> Enter the code from your notifications
          </p>
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={(e) => e.key === 'Enter' && code.length === 6 && !busy && submit()}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              aria-label="Verification code"
              className="inp text-center font-mono tracking-[0.4em]"
            />
            <button
              type="button"
              onClick={submit}
              disabled={busy || code.length !== 6}
              className="btn btn-pri shrink-0 px-4 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? 'Releasing…' : 'Release'}
            </button>
          </div>
          {err ? (
            <p className="mt-2 text-xs" style={{ color: 'var(--bad-text)' }}>{err}</p>
          ) : w.attemptsLeft <= 3 ? (
            <p className="mt-2 text-xs" style={{ color: 'var(--bad-text)' }}>
              {w.attemptsLeft} attempt{w.attemptsLeft === 1 ? '' : 's'} left before this request locks.
            </p>
          ) : null}
        </div>
      )}

      {w.status === 'pending' && (
        <p className="mt-4 flex items-center gap-1.5 text-xs mut">
          <Clock size={13} /> Waiting for an administrator to approve this payout.
        </p>
      )}

      {w.status === 'released' && (
        <p className="mt-4 text-xs grn">
          Paid out {fmtDay(w.releasedAt)} — the {itemLabel}s are now closed.
        </p>
      )}

      {w.status === 'rejected' && (
        <p className="mt-4 text-xs" style={{ color: 'var(--bad-text)' }}>
          {w.rejectReason}
          {w.feeRefundedAt && (
            <span className="mt-1 block mut">
              The {fmtMoney(w.fee)} gas fee was returned to your balance.
            </span>
          )}
        </p>
      )}
    </div>
  );
}
