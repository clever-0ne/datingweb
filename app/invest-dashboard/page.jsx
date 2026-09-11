'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, ArrowRight, TrendingUp, Wallet, Clock, PiggyBank, ArrowUpFromLine, ShieldCheck, X, Zap } from 'lucide-react';
import { useWallet, fmtMoney } from '@/lib/wallet';
import { WITHDRAWAL_FEE_PCT } from '@/lib/plans';
import { round2 } from '@/lib/format';
import PayoutCard from '@/components/PayoutCard';
import BoostModal from '@/components/BoostModal';
import { Countdown } from '@/components/MiningLive';

/**
 * Investments-only view. Mining contracts are deliberately absent here — they
 * live on /my-miners and /cloud-mining. That means the headline figures must
 * come from `investmentPortfolio`, not `portfolio`: the latter is the combined
 * mining + investment summary and would inflate every number on this page.
 */
function Row({ k, v }) {
  return (
    <div className="flex justify-between">
      <span className="mut">{k}</span>
      <span className="font-medium text-white">{v}</span>
    </div>
  );
}

export default function InvestDashboardPage() {
  const {
    balance, investmentPortfolio, investments,
    investmentWithdrawals, boostInvestment,
    requestInvestmentWithdrawal, confirmInvestmentWithdrawal,
  } = useWallet();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [boostPlan, setBoostPlan] = useState(null);

  // Only matured plans that are not already tied to a live payout request.
  const matured = investments.filter((i) => i.withdrawable);
  const running = investments.filter((i) => i.status === 'active');

  // The soonest a still-running plan matures, so an empty modal can say when
  // rather than just "not yet".
  const nextMaturity = running.length
    ? running.reduce((soonest, i) => (!soonest || i.maturesAt < soonest ? i.maturesAt : soonest), null)
    : null;

  const gross = matured.reduce((s, i) => s + i.returnAmount, 0);
  const fee = round2(gross * (WITHDRAWAL_FEE_PCT / 100));
  // The fee is taken from the balance when the request opens, so a balance that
  // cannot cover it blocks the request — mirrored here so the button does not
  // invite a click the server will refuse.
  const feeCovered = balance >= fee;

  const submitRequest = async () => {
    setBusy(true);
    setNotice(null);
    const d = await requestInvestmentWithdrawal();
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

  const stats = [
    { label: 'Active Capital', value: fmtMoney(investmentPortfolio.activeCapital), note: `${investmentPortfolio.activeContracts} active plan${investmentPortfolio.activeContracts === 1 ? '' : 's'}`, noteCls: 'blut', icon: Wallet, chip: 'chip-b' },
    { label: 'Total Returns', value: fmtMoney(investmentPortfolio.totalReturns), note: 'Expected profit', noteCls: 'grn', icon: TrendingUp, chip: 'chip-g' },
    { label: 'Realized Gains', value: fmtMoney(investmentPortfolio.realizedGains), note: 'Matured & paid', noteCls: 'grn', icon: PiggyBank, chip: 'chip-y' },
    { label: 'Monthly Yield', value: fmtMoney(investmentPortfolio.monthlyYield), note: 'Est. next 30 days', noteCls: 'blut', icon: Clock, chip: 'chip-p' },
  ];

  // Investment plans only, active first.
  const plans = investments
    .map((i) => ({
      id: i.id, name: i.planName, amount: i.amount,
      ret: i.returnAmount - i.amount, returnAmount: i.returnAmount, status: i.status, term: `${i.termDays} days`,
    }))
    .sort((a, b) => (a.status === 'active' ? -1 : 1) - (b.status === 'active' ? -1 : 1));

  const invCapital = investments.reduce((s, i) => s + i.amount, 0);
  const invExpected = investments.reduce((s, i) => s + i.returnAmount, 0);

  return (
    <>
      {/* Hero */}
      <div className="panel relative mb-6 overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-400">Tesla Capital</p>
            <h1 className="mb-1 text-2xl font-semibold text-white">Investment Dashboard</h1>
            <p className="text-sm mut">Live performance across your investment plans.</p>
            {matured.length > 0 && (
              <p className="mt-2 text-xs grn">
                {matured.length} matured plan{matured.length === 1 ? '' : 's'} ready to withdraw · {fmtMoney(gross)} gross
              </p>
            )}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => { setConfirmOpen(true); setNotice(null); }}
              className="btn btn-sec self-start sm:self-auto"
            >
              <ArrowUpFromLine size={16} /> Withdraw Investment
            </button>
            <Link href="/invest" className="btn btn-pri self-start sm:self-auto"><Plus size={16} /> New Investment</Link>
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

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="card">
              <div className="mb-1 flex items-center justify-between">
                <p className="text-xs mut">{s.label}</p>
                <span className={`chip ${s.chip} h-7 w-7 rounded-full`}><Icon size={14} /></span>
              </div>
              <p className="text-lg font-semibold text-white">{s.value}</p>
              <p className={`text-xs font-medium ${s.noteCls}`}>{s.note}</p>
            </div>
          );
        })}
      </div>

      {/* Active plans */}
      <div className="mb-6 panel p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="mb-1 text-lg font-medium text-white">Active Plans</h3>
            <p className="text-xs mut">Your investment plans and their performance</p>
          </div>
        </div>
        {plans.length === 0 ? (
          <p className="py-8 text-center text-sm mut">No plans yet. <Link href="/invest" className="blut">Start investing</Link>.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>Plan</th><th>Amount</th><th>Return</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {plans.map((p) => (
                  <tr key={p.id}>
                    <td className="py-3">
                      <p className="font-medium text-white">{p.name}</p>
                      <p className="text-xs mut">{p.term}</p>
                    </td>
                    <td className="py-3 mut">{fmtMoney(p.amount)}</td>
                    <td className="py-3 grn">+{fmtMoney(p.ret)}</td>
                    <td className="py-3">
                      <span className={`pill ${p.status === 'active' ? 'pill-sec' : 'pill-gry'}`}>
                        {p.status === 'active' ? 'Active' : 'Completed'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {p.status === 'active' && (
                        <button
                          type="button"
                          onClick={() => setBoostPlan(p)}
                          className="btn btn-sec px-3 py-1.5 text-xs"
                        >
                          <Zap size={14} /> Boost
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Investment total */}
      <div className="panel p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-medium text-white">Investment Plans</h3>
          <Link href="/invest" className="text-xs font-medium blut">Browse <ArrowRight size={12} className="inline" /></Link>
        </div>
        <p className="text-sm mut">
          {investments.length} plan{investments.length === 1 ? '' : 's'} · {fmtMoney(invCapital)} invested ·
          expected {fmtMoney(invExpected)}.
        </p>
      </div>

      {/* Payout requests — same format as the mining payouts. */}
      {investmentWithdrawals.length > 0 && (
        <div className="mt-8">
          <div className="mb-4">
            <h2 className="text-lg font-light text-white">Investment Payouts</h2>
            <p className="text-xs mut">Matured plans cashed out to your main balance.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {investmentWithdrawals.map((w) => (
              <PayoutCard key={w.id} w={w} onConfirm={confirmInvestmentWithdrawal} itemLabel="plan" />
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
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Investment Payout</p>
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
                    ? <>Your next plan matures in <Countdown to={nextMaturity} className="font-mono text-white" />. A plan becomes withdrawable the moment its term ends.</>
                    : 'Open a plan and its return becomes withdrawable when the term ends.'}
                </p>
              </div>
            ) : (
              <div className="mb-5 space-y-2 text-sm">
                <Row k={`Plans (${matured.length})`} v={fmtMoney(gross)} />
                <Row
                  k={`Gas fee (${WITHDRAWAL_FEE_PCT}%) — charged now`}
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
              <Link href="/invest" className="btn btn-pri w-full py-3">
                <Plus size={16} /> Browse Plans
              </Link>
            )}
          </div>
        </div>
      )}

      {boostPlan && (
        <BoostModal
          item={{ name: boostPlan.name, currentReturn: boostPlan.returnAmount }}
          balance={balance}
          onBoost={(amount) => boostInvestment(boostPlan.id, amount)}
          onClose={() => setBoostPlan(null)}
        />
      )}
    </>
  );
}
