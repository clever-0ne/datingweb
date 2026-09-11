'use client';

import { useState } from 'react';
import { Wallet, Info, X, Zap } from 'lucide-react';
import { useWallet, fmtMoney } from '@/lib/wallet';
import { MINING_TIERS, miningDaily, HASHRATE_UNIT } from '@/lib/plans';
import { MiningBars } from '@/components/MiningLive';

export default function CloudMiningPage() {
  const { balance, buyMining } = useWallet();
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);

  const tier = MINING_TIERS.find((t) => t.id === selected);
  const insufficient = tier && balance < tier.price;

  const confirmPurchase = async () => {
    if (!tier) return;
    setBusy(true);
    setNotice(null);
    const d = await buyMining(tier.id);
    setBusy(false);
    if (d?.ok) {
      setNotice({ kind: 'ok', text: `${tier.name} activated — ${fmtMoney(tier.price)} debited from your balance.` });
      setSelected(null);
    } else {
      setNotice({ kind: 'err', text: d?.error || 'Purchase failed.' });
    }
  };

  return (
    <>
      {/* Hero */}
      <div className="panel relative mb-6 overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-400">Tesla Capital</p>
            <h1 className="mb-1 text-2xl font-semibold text-white">Cloud Mining</h1>
            <p className="text-sm mut">Buy a time-limited contract and earn a fixed return at maturity.</p>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5" style={{ background: 'rgba(47,138,104,.08)', border: '1px solid rgba(47,138,104,.22)' }}>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              <span className="text-xs font-semibold grn">Farm online</span>
              <MiningBars />
            </div>
          </div>
          <div className="card flex items-center gap-3 self-start px-5 py-3 lg:self-auto">
            <div className="chip chip-p h-10 w-10 rounded-full"><Wallet size={20} /></div>
            <div>
              <p className="text-xs mut">Your Balance</p>
              <p className="text-lg font-semibold text-white">{fmtMoney(balance)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pay with */}
      <div className="card mb-6 flex flex-wrap items-center gap-3">
        <span className="text-sm mut">Pay with:</span>
        <span className="pill pill-pri">Account Balance ({fmtMoney(balance)})</span>
        <span className="text-xs mut">The cost is debited instantly on confirmation.</span>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {MINING_TIERS.map((p) => {
          const daily = miningDaily(p);
          const isSel = selected === p.id;
          return (
            <div
              key={p.id}
              className={`card flex flex-col transition ${isSel ? 'ring-2 ring-[#2f6dff]' : ''}`}
              style={isSel ? { borderColor: 'rgba(47,109,255,.6)' } : undefined}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">{p.name}</h3>
                <span className="pill pill-pri"><Zap size={12} /> {p.days} days</span>
              </div>
              <div className="mb-1 flex items-end gap-1">
                <span className="text-3xl font-bold text-white">{fmtMoney(p.price)}</span>
              </div>
              <p className="mb-3 text-sm mut">invested · returns {fmtMoney(p.totalReturn)}</p>
              <div className="mb-4 flex items-baseline gap-1.5 rounded-xl px-3 py-2" style={{ background: 'rgba(148,163,184,.06)' }}>
                <span className="text-lg font-bold text-white">{p.hashrate}</span>
                <span className="text-xs mut">{HASHRATE_UNIT}</span>
                <span className="ml-auto text-xs mut">allocated</span>
              </div>
              <div className="mb-5 space-y-2 text-sm">
                <div className="flex justify-between"><span className="mut">Total return</span><span className="font-medium grn">{fmtMoney(p.totalReturn)}</span></div>
                <div className="flex justify-between"><span className="mut">Net profit</span><span className="font-medium grn">+{fmtMoney(p.totalReturn - p.price)}</span></div>
                <div className="flex justify-between"><span className="mut">Daily earnings</span><span className="font-medium text-white">{fmtMoney(daily)}</span></div>
                <div className="flex justify-between"><span className="mut">Term</span><span className="font-medium text-white">{p.days} days</span></div>
              </div>
              <button
                onClick={() => { setSelected(isSel ? null : p.id); setNotice(null); }}
                className={`btn mt-auto w-full ${isSel ? 'btn-pri' : 'btn-sec'}`}
              >
                <Info size={14} /> {isSel ? 'Selected' : 'Buy Contract'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Note */}
      <div className="mt-6 flex items-start gap-2 rounded-2xl border p-4 text-sm" style={{ borderColor: 'rgba(47,138,104,.3)', background: 'rgba(47,138,104,.08)' }}>
        <Info size={16} className="mt-0.5 shrink-0 grn" />
        <span className="mut">
          These are <strong className="text-white">hosted mining contracts</strong> — you pay the tier price upfront and receive the
          <strong className="text-white"> total return</strong> when the term completes. The full return is credited on maturity.
        </span>
      </div>

      {/* Contract preview modal */}
      {tier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => { setSelected(null); setNotice(null); }} />
          <div className="card relative z-10 w-full max-w-md p-6">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Contract Preview</p>
                <h2 className="text-xl font-bold text-white">{tier.name}</h2>
              </div>
              <button onClick={() => { setSelected(null); setNotice(null); }} className="text-slate-400 hover:text-white" aria-label="Close">
                <X size={20} />
              </button>
            </div>

            <div className="mb-5 space-y-2 text-sm">
              <div className="flex justify-between"><span className="mut">Invest</span><span className="font-medium text-white">{fmtMoney(tier.price)}</span></div>
              <div className="flex justify-between"><span className="mut">Hashrate</span><span className="font-medium text-white">{tier.hashrate} {HASHRATE_UNIT}</span></div>
              <div className="flex justify-between"><span className="mut">Total return</span><span className="font-medium grn">{fmtMoney(tier.totalReturn)}</span></div>
              <div className="flex justify-between"><span className="mut">Net profit</span><span className="font-medium grn">+{fmtMoney(tier.totalReturn - tier.price)}</span></div>
              <div className="flex justify-between"><span className="mut">Daily earnings</span><span className="font-medium text-white">{fmtMoney(miningDaily(tier))}</span></div>
              <div className="flex justify-between"><span className="mut">Term</span><span className="font-medium text-white">{tier.days} days</span></div>
            </div>

            {notice && (
              <p className={`mb-4 rounded-xl px-3 py-2 text-xs font-medium ${notice.kind === 'ok' ? 'bg-[rgba(47,138,104,.15)] text-[#5ee0a9]' : 'bg-[rgba(239,68,68,.15)] text-[#fca5a5]'}`}>
                {notice.text}
              </p>
            )}

            <button
              onClick={confirmPurchase}
              disabled={busy || insufficient}
              className="btn btn-pri w-full py-3 disabled:opacity-60"
            >
              {insufficient ? 'Insufficient balance' : busy ? 'Activating…' : 'Confirm Purchase'}
            </button>
            {insufficient && <p className="mt-2 text-center text-xs text-[#fca5a5]">You need {fmtMoney(tier.price - balance)} more in your account balance.</p>}
          </div>
        </div>
      )}
    </>
  );
}
