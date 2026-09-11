'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Plus, Cpu, Clock, Wallet, TrendingUp, ArrowUpFromLine, ShieldCheck, X, Zap,
} from 'lucide-react';
import { useWallet, fmtMoney } from '@/lib/wallet';
import { MINING_WITHDRAWAL_FEE_PCT, HASHRATE_UNIT } from '@/lib/plans';
import { round2 } from '@/lib/format';
import PayoutCard from '@/components/PayoutCard';
import BoostModal from '@/components/BoostModal';
import {
  MiningBars, LiveEarnings, MiningProgress, TotalMiningEarnings, Countdown,
} from '@/components/MiningLive';

function MinerCard({ m, onBoost }) {
  // No timer and no state here: the countdown and the accruing figures below
  // each tick themselves in place. Re-rendering this card once a second was
  // re-rendering every other card in the grid along with it.
  const active = m.status === 'active';

  return (
    <div className="card flex flex-col">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-bold text-white">
          <Cpu size={18} className="text-[#2f6dff]" /> {m.tierName}
        </h3>
        <span className={`pill ${active ? 'pill-sec' : 'pill-gry'}`}>
          <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full" style={{ background: active ? '#2f8a68' : '#64748b' }} />
          {active ? 'Active' : 'Completed'}
        </span>
      </div>

      {active ? (
        <div className="mb-4 flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: 'rgba(47,138,104,.08)', border: '1px solid rgba(47,138,104,.15)' }}>
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
          </span>
          <span className="text-xs font-semibold grn">Mining</span>
          <Countdown to={m.expiresAt} className="ml-auto font-mono text-xs text-slate-400" />
          <MiningBars />
        </div>
      ) : (
        <div className="mb-4 flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: 'rgba(148,163,184,.08)', border: '1px solid rgba(148,163,184,.15)' }}>
          <Clock size={14} className="text-slate-400" />
          <span className="text-xs font-semibold text-slate-400">Matured</span>
          {m.withdrawable && <span className="ml-auto text-xs font-medium grn">Ready to withdraw</span>}
        </div>
      )}

      {m.hashrate != null && (
        <div className="mb-4 flex items-end gap-1">
          <span className="text-2xl font-bold text-white">{m.hashrate}</span>
          <span className="mb-1 text-sm mut">{HASHRATE_UNIT}</span>
        </div>
      )}

      {active && (
        <div className="mb-4">
          <p className="mb-0.5 text-xs mut">Mined so far</p>
          <p className="text-2xl font-bold grn"><LiveEarnings contract={m} /></p>
          <div className="mt-2"><MiningProgress contract={m} /></div>
          <p className="mt-1 text-xs mut">of {fmtMoney(m.totalReturn)} at maturity</p>
        </div>
      )}

      <div className="space-y-2 text-sm">
        <Row k="Amount invested" v={fmtMoney(m.price)} />
        <Row k="Total return" v={<span className="grn">{fmtMoney(m.totalReturn)}</span>} />
        <Row k="Net profit" v={<span className="grn">+{fmtMoney(m.totalReturn - m.price)}</span>} />
        <Row k="Daily earnings" v={fmtMoney(m.dailyEarnings)} />
        <Row k="Term" v={`${m.days} days`} />
        <Row k="Expires" v={new Date(m.expiresAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })} />
      </div>

      {active && (
        <button
          type="button"
          onClick={() => onBoost(m)}
          className="btn btn-sec mt-4 w-full"
        >
          <Zap size={16} /> Boost Payout
        </button>
      )}
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

/* ================================================================== */

export default function MyMinersPage() {
  const {
    balance, mining, miningWithdrawals, boostMining,
    requestMiningWithdrawal, confirmMiningWithdrawal,
  } = useWallet();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [boostItem, setBoostItem] = useState(null);

  const active = mining.filter((m) => m.status === 'active');
  const invested = mining.reduce((s, m) => s + m.price, 0);
  const expectedReturn = mining.reduce((s, m) => s + m.totalReturn, 0);
  const daily = active.reduce((s, m) => s + m.dailyEarnings, 0);

  // Only matured contracts that are not already tied to a live payout request.
  const matured = mining.filter((m) => m.withdrawable);

  // The soonest a still-running contract will become withdrawable, so the
  // empty state can say when rather than just "not yet".
  const nextMaturity = active.length
    ? active.reduce((soonest, m) => (!soonest || m.expiresAt < soonest ? m.expiresAt : soonest), null)
    : null;
  const gross = matured.reduce((s, m) => s + m.totalReturn, 0);
  const fee = round2(gross * (MINING_WITHDRAWAL_FEE_PCT / 100));
  // The fee is taken from the balance when the request opens, so a balance that
  // cannot cover it blocks the request — mirrored here so the button does not
  // invite a click the server will refuse.
  const feeCovered = balance >= fee;

  const summary = [
    { label: 'Active Contracts', value: String(active.length), icon: Cpu, chip: 'chip-b' },
    { label: 'Total Invested', value: fmtMoney(invested), icon: Wallet, chip: 'chip-p' },
    { label: 'Total Return', value: fmtMoney(expectedReturn), icon: TrendingUp, chip: 'chip-g' },
    { label: 'Daily Earnings', value: fmtMoney(daily), icon: Clock, chip: 'chip-y' },
  ];

  const submitRequest = async () => {
    setBusy(true);
    setNotice(null);
    const d = await requestMiningWithdrawal();
    setBusy(false);
    setConfirmOpen(false);
    if (d?.ok) {
      setNotice({
        kind: 'ok',
        text: `Request ${d.request?.id} submitted. It moves to your main balance once an administrator approves it and you enter your code.`,
      });
    } else {
      setNotice({ kind: 'err', text: d?.error || 'Could not submit the request.' });
    }
  };

  return (
    <>
      {/* Hero */}
      <div className="panel relative mb-6 overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-400">Tesla Capital</p>
            <h1 className="mb-1 text-2xl font-semibold text-white">My Miners</h1>
            <p className="text-sm mut">Track your active and completed mining contracts.</p>
            {matured.length > 0 && (
              <p className="mt-2 text-xs grn">
                {matured.length} matured contract{matured.length === 1 ? '' : 's'} ready to withdraw · {fmtMoney(gross)} gross
              </p>
            )}
          </div>
          <div className="flex flex-col gap-4">
            {active.length > 0 && (
              <div
                className="rounded-2xl px-5 py-3"
                style={{ background: 'rgba(47,138,104,.08)', border: '1px solid rgba(47,138,104,.22)' }}
              >
                <div className="mb-1 flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                  </span>
                  <p className="text-xs mut">Mining earnings so far</p>
                  <MiningBars />
                </div>
                <p className="text-2xl font-bold grn">
                  <TotalMiningEarnings contracts={active} />
                </p>
                <p className="mt-1 text-xs mut">
                  across {active.length} active contract{active.length === 1 ? '' : 's'} · credited at maturity
                </p>
              </div>
            )}
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => { setConfirmOpen(true); setNotice(null); }}
                className="btn btn-sec self-start sm:self-auto"
              >
                <ArrowUpFromLine size={16} /> Withdraw Mining
              </button>
              <Link href="/cloud-mining" className="btn btn-pri self-start sm:self-auto">
                <Plus size={16} /> Buy More
              </Link>
            </div>
          </div>
        </div>
      </div>

      {notice && (
        <div
          className="mb-6 rounded-xl px-4 py-3 text-xs font-medium"
          style={
            notice.kind === 'ok'
              ? { background: 'rgba(47,138,104,.15)', color: '#5ee0a9' }
              : { background: 'rgba(239,68,68,.15)', color: '#fca5a5' }
          }
        >
          {notice.text}
        </div>
      )}

      {/* Summary */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summary.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="card">
              <div className="mb-1 flex items-center justify-between">
                <p className="text-xs mut">{s.label}</p>
                <span className={`chip ${s.chip} h-7 w-7 rounded-full`}><Icon size={14} /></span>
              </div>
              <p className="text-lg font-semibold text-white">{s.value}</p>
            </div>
          );
        })}
      </div>

      {/* Miners grid */}
      {mining.length === 0 ? (
        <div className="panel p-10 text-center">
          <Cpu size={40} className="mx-auto mb-3 text-slate-500" />
          <h3 className="mb-1 text-lg font-semibold text-white">No mining contracts yet</h3>
          <p className="mb-5 text-sm mut">Buy your first contract to start earning a fixed return.</p>
          <Link href="/cloud-mining" className="btn btn-pri"><Plus size={16} /> Browse Contracts</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {mining.map((m) => <MinerCard key={m.id} m={m} onBoost={setBoostItem} />)}
        </div>
      )}

      {/* Payout requests */}
      {miningWithdrawals.length > 0 && (
        <div className="mt-8">
          <div className="mb-4">
            <h2 className="text-lg font-light text-white">Mining Payouts</h2>
            <p className="text-xs mut">Matured contracts cashed out to your main balance.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {miningWithdrawals.map((w) => (
              <PayoutCard key={w.id} w={w} onConfirm={confirmMiningWithdrawal} itemLabel="contract" />
            ))}
          </div>
        </div>
      )}

      {/* Withdraw confirmation */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => !busy && setConfirmOpen(false)} />
          <div className="card relative z-10 w-full max-w-md p-6">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Mining Payout</p>
                <h2 className="text-xl font-bold text-white">Withdraw matured returns</h2>
              </div>
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="text-slate-400 hover:text-white"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {matured.length === 0 ? (
              <div className="mb-5 rounded-xl p-4 text-sm" style={{ background: 'rgba(148,163,184,.08)', border: '1px solid rgba(148,163,184,.15)' }}>
                <p className="font-semibold text-white">Nothing has matured yet</p>
                <p className="mt-1 text-xs leading-relaxed mut">
                  {nextMaturity
                    ? <>Your next contract matures in <Countdown to={nextMaturity} className="font-mono text-white" />. A contract becomes withdrawable the moment its term ends — the earnings above are still accruing until then.</>
                    : 'Buy a contract and its return becomes withdrawable when the term ends.'}
                </p>
              </div>
            ) : (
              <div className="mb-5 space-y-2 text-sm">
                <Row k={`Contracts (${matured.length})`} v={fmtMoney(gross)} />
                <Row
                  k={`Gas fee (${MINING_WITHDRAWAL_FEE_PCT}%) — charged now`}
                  v={<span style={{ color: '#fca5a5' }}>−{fmtMoney(fee)}</span>}
                />
                <div className="border-t pt-2" style={{ borderColor: 'rgba(148,163,184,.15)' }}>
                  <Row k="Credited on release" v={<span className="grn">{fmtMoney(gross)}</span>} />
                </div>
                <Row k="Balance after fee" v={fmtMoney(round2(balance - fee))} />
              </div>
            )}

            <div className="mb-5 flex gap-2 rounded-xl p-3" style={{ background: 'rgba(10,84,255,.07)', border: '1px solid rgba(47,109,255,.25)' }}>
              <ShieldCheck size={16} className="mt-0.5 shrink-0 blut" />
              <p className="text-xs leading-relaxed mut">
                The gas fee is charged against your balance now, when you submit — never paid by
                transfer to anyone. If the request is declined the fee is refunded in full. Once an
                administrator approves, your six-digit code arrives in your notifications and the
                full {fmtMoney(gross)} is credited when you enter it.
              </p>
            </div>

            {matured.length > 0 ? (
              <>
                <button
                  type="button"
                  onClick={submitRequest}
                  disabled={busy || !feeCovered}
                  className="btn btn-pri w-full py-3 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy ? 'Submitting…' : feeCovered ? 'Submit Withdrawal Request' : 'Insufficient balance for fee'}
                </button>
                {!feeCovered && (
                  <p className="mt-2 text-center text-xs" style={{ color: '#fca5a5' }}>
                    You need {fmtMoney(round2(fee - balance))} more to cover the gas fee.
                  </p>
                )}
              </>
            ) : (
              <Link href="/cloud-mining" className="btn btn-pri w-full py-3">
                <Plus size={16} /> Buy a Contract
              </Link>
            )}
          </div>
        </div>
      )}

      {boostItem && (
        <BoostModal
          item={{ name: boostItem.tierName, currentReturn: boostItem.totalReturn }}
          balance={balance}
          onBoost={(amount) => boostMining(boostItem.id, amount)}
          onClose={() => setBoostItem(null)}
        />
      )}
    </>
  );
}
