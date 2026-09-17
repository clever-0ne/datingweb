'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TrendingUp, ArrowRight, X } from 'lucide-react';
import { useWallet, fmtMoney } from '@/lib/wallet';
import { INVESTMENT_PLANS, planReturn } from '@/lib/plans';

// Derived rather than written out, so the hero can't contradict the plans.
const TERMS = [...new Set(INVESTMENT_PLANS.map((p) => p.termDays))].sort((a, b) => a - b);
const TERM_LABEL = TERMS.length === 1 ? `${TERMS[0]} days` : `${TERMS[0]}–${TERMS[TERMS.length - 1]} days`;
const MULTIPLE = `${Math.round((1 + INVESTMENT_PLANS[0].roi / 100) * 100) / 100}×`;

const PLATFORM = [
  { label: 'Portfolio Value', value: '$2.4B+', note: 'Fleet-backed returns with transparent tracking' },
  { label: 'Avg. Annual Yield', value: '18.4%', note: 'Earn yield on Tesla vehicle inventory', green: true },
  { label: 'Active Investors', value: '150K+', note: 'Fund with BTC, ETH, USDT and more' },
];

export default function InvestPage() {
  const { balance, buyInvestment } = useWallet();
  const [plan, setPlan] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const selPlan = INVESTMENT_PLANS.find((p) => p.id === plan);
  const insufficient = selPlan && balance < selPlan.amount;

  const confirmPlan = async () => {
    if (!selPlan) return;
    setBusy(true);
    setNotice(null);
    const d = await buyInvestment(selPlan.id);
    setBusy(false);
    if (d?.ok) {
      setNotice({ kind: 'ok', text: `${selPlan.name} plan activated — ${fmtMoney(selPlan.amount)} debited from your balance.` });
      setPlan(null);
    } else {
      setNotice({ kind: 'err', text: d?.error || 'Purchase failed.' });
    }
  };

  return (
    <>
      {/* Hero */}
      <div className="panel relative mb-6 p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="mb-4 lg:mb-0 lg:flex-1">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-400">Investing</p>
            <h1 className="mb-1 text-2xl font-semibold text-white">Investment Plans</h1>
            <p className="text-sm mut">Discover and invest in diversified portfolios designed for growth</p>
          </div>
          <div className="card lg:w-80">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="mb-1 text-xs mut">Available Plans</p>
                <p className="text-lg font-semibold text-white">{INVESTMENT_PLANS.length}</p>
              </div>
              <div className="chip chip-b h-10 w-10 rounded-xl"><TrendingUp size={20} /></div>
            </div>
            <div className="flex gap-4 text-xs">
              <div className="flex-1 text-center"><p className="mut">Term</p><p className="font-semibold text-white">{TERM_LABEL}</p></div>
              <div className="flex-1 text-center"><p className="mut">Return</p><p className="font-semibold text-white">{MULTIPLE}</p></div>
            </div>
          </div>
        </div>
      </div>

      {/* Platform stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {PLATFORM.map((p) => (
          <div key={p.label} className="panel p-5">
            <p className="text-xs font-medium uppercase tracking-wide faint">{p.label}</p>
            <p className={`mt-2 text-2xl font-bold ${p.green ? 'grn' : 'text-white'}`}>{p.value}</p>
            <p className="mt-1 text-xs mut">{p.note}</p>
          </div>
        ))}
      </div>

      {/* Investment Plans */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-light text-white">Investment Plans</h2>
            <p className="text-xs mut">Every tier returns {MULTIPLE} your principal over a {TERM_LABEL.toLowerCase()} term.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {INVESTMENT_PLANS.map((p, idx) => {
            const chipCls = ['chip-g', 'chip-b', 'chip-p', 'chip-y'][idx % 4];
            return (
              <div key={p.id} className={`panel flex flex-col p-6 transition ${plan === p.id ? 'ring-2 ring-[#2f6dff]' : ''}`}>
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`chip ${chipCls} h-11 w-11 rounded-xl`}><TrendingUp size={20} /></div>
                    <div>
                      <h3 className="font-medium text-white">{p.name}</h3>
                      <p className="text-sm mut">{p.termDays}-Day Plan</p>
                    </div>
                  </div>
                  <span className="pill pill-pri">{p.roi}% ROI</span>
                </div>
                <div className="mb-4 space-y-3">
                  <Row k="Principal:" v={fmtMoney(p.amount)} />
                  <Row k="Return:" v={fmtMoney(planReturn(p))} green />
                  <Row k="Profit:" v={`+${fmtMoney(planReturn(p) - p.amount)}`} green />
                </div>
                <div className="mt-auto flex items-center justify-between gap-3">
                  <button className="text-xs font-medium text-white hover:opacity-70" onClick={() => { setPlan(p.id); setNotice(null); }}>
                    View Details <ArrowRight size={12} className="inline" />
                  </button>
                  <button onClick={() => { setPlan(p.id); setNotice(null); }} className="btn btn-pri" style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}>
                    Invest
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Plan preview modal */}
      {selPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => { setPlan(null); setNotice(null); }} />
          <div className="card card-static relative z-10 w-full max-w-md p-6">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Plan Preview</p>
                <h2 className="text-xl font-bold text-white">{selPlan.name} · {selPlan.roi}% ROI</h2>
              </div>
              <button onClick={() => { setPlan(null); setNotice(null); }} className="text-slate-400 hover:text-white" aria-label="Close">
                <X size={20} />
              </button>
            </div>

            <div className="mb-5 space-y-2 text-sm">
              <div className="flex justify-between"><span className="mut">Principal</span><span className="font-medium text-white">{fmtMoney(selPlan.amount)}</span></div>
              <div className="flex justify-between"><span className="mut">Return at maturity</span><span className="font-medium grn">{fmtMoney(planReturn(selPlan))}</span></div>
              <div className="flex justify-between"><span className="mut">Net profit</span><span className="font-medium grn">+{fmtMoney(planReturn(selPlan) - selPlan.amount)}</span></div>
              <div className="flex justify-between"><span className="mut">Term</span><span className="font-medium text-white">{selPlan.termDays} days</span></div>
            </div>

            {notice && (
              <p className={`mb-4 rounded-xl px-3 py-2 text-xs font-medium ${notice.kind === 'ok' ? 'bg-[rgba(47,138,104,.15)] text-[#5ee0a9]' : 'bg-[rgba(239,68,68,.15)] text-[#fca5a5]'}`}>
                {notice.text}
              </p>
            )}

            <button onClick={confirmPlan} disabled={busy || insufficient} className="btn btn-pri w-full py-3 disabled:opacity-60">
              {insufficient ? 'Insufficient balance' : busy ? 'Activating…' : 'Confirm Investment'}
            </button>
            {insufficient && <p className="mt-2 text-center text-xs text-[#fca5a5]">You need {fmtMoney(selPlan.amount - balance)} more in your account balance.</p>}
          </div>
        </div>
      )}
    </>
  );
}

function Row({ k, v, green, purple }) {
  return (
    <div className="flex justify-between">
      <span className="text-sm mut">{k}</span>
      <span className={`text-sm font-medium ${green ? 'grn' : purple ? 'tert' : 'text-white'}`}>{v}</span>
    </div>
  );
}
