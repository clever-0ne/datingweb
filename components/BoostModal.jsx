'use client';

import { useState } from 'react';
import { X, Zap } from 'lucide-react';
import { fmtMoney } from '@/lib/wallet';
import { round2 } from '@/lib/format';
import { BOOST_MULTIPLIER } from '@/lib/plans';

/**
 * Shared modal for boosting a running mining contract or investment.
 *
 * `item` is `{ name, currentReturn }` — the two products differ only in the
 * field name (`totalReturn` vs `returnAmount`), so the caller normalises to
 * this shape. `onBoost(amount)` is the wallet mutation, which re-queries the
 * wallet on success; the modal just closes on `ok` and shows the error otherwise.
 */
export default function BoostModal({ item, balance, onBoost, onClose }) {
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const amt = Number(amount) || 0;
  const added = round2(amt * BOOST_MULTIPLIER);
  const newReturn = round2(Number(item.currentReturn) + added);
  const covered = amt > 0 && amt <= balance;

  const submit = async () => {
    if (!covered || busy) return;
    setBusy(true);
    setErr(null);
    const d = await onBoost(amt);
    setBusy(false);
    if (d?.ok) onClose();
    else setErr(d?.error || 'Could not boost this position.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={() => !busy && onClose()} />
      <div className="card card-static relative z-10 w-full max-w-md p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Boost Payout</p>
            <h2 className="text-xl font-bold text-white">{item.name}</h2>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="mb-4 rounded-xl p-3" style={{ background: 'rgba(10,84,255,.07)', border: '1px solid rgba(47,109,255,.25)' }}>
          <p className="text-xs mut">Current payout</p>
          <p className="text-2xl font-bold grn">{fmtMoney(item.currentReturn)}</p>
        </div>

        <label className="mb-1 block text-xs mut" htmlFor="boost-amount">Boost amount</label>
        <input
          id="boost-amount"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          autoFocus
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="inp mb-4 font-mono text-lg"
        />

        <div className="mb-4 space-y-2 text-sm">
          <Row k={`Payout added (${BOOST_MULTIPLIER}×)`} v={<span className="grn">+{fmtMoney(added)}</span>} />
          <div className="border-t pt-2" style={{ borderColor: 'rgba(148,163,184,.15)' }}>
            <Row k="New payout" v={<span className="grn">{fmtMoney(newReturn)}</span>} />
          </div>
          <Row k="Balance after boost" v={fmtMoney(round2(balance - amt))} />
        </div>

        {err && (
          <p className="mb-4 rounded-lg px-3 py-2 text-xs font-medium" style={{ background: 'rgba(239,68,68,.15)', color: '#fca5a5' }}>
            {err}
          </p>
        )}

        <button
          type="button"
          onClick={submit}
          disabled={!covered || busy}
          className="btn btn-pri w-full py-3 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? 'Boosting…' : covered ? `Boost by ${fmtMoney(amt)}` : amt > balance ? 'Amount exceeds balance' : 'Enter a boost amount'}
        </button>
      </div>
    </div>
  );
}

function Row({ k, v }) {
  return (
    <div className="flex justify-between">
      <span className="mut">{k}</span>
      <span className="font-medium text-white">{v}</span>
    </div>
  );
}
