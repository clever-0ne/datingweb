'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useWallet, fmtMoney } from '@/lib/wallet';
import { usePrices } from '@/lib/prices';
import { fmtPrice, fmtChange } from '@/lib/market';
import { CARS } from '@/lib/cars';
import { glowOf } from '@/lib/ui';
import TradingViewChart from '@/components/TradingViewChart';
import {
  Wallet, Eye, EyeOff, PlusCircle, ArrowUpRight, DollarSign, Gift, ArrowDown,
  ArrowUp, Calendar, TrendingUp, CheckCircle, PauseCircle, ChevronRight, Users, Copy, Briefcase, Car, Cpu,
} from 'lucide-react';

const fmtDay = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const TXN_ICONS = {
  gift: Gift,
  'trending-up': TrendingUp,
  'arrow-down': ArrowDown,
  'arrow-up': ArrowUp,
  briefcase: Briefcase,
  cpu: Cpu,
  'shopping-bag': Briefcase,
};

// Derived from the same catalogue /inventory and the checkout read, so the
// prices here cannot disagree with what a purchase actually costs.
const CHIPS = ['chip-b', 'chip-g', 'chip-p'];
const INVENTORY = CARS.slice(0, 3).map((c, i) => ({
  slug: c.slug,
  name: `Tesla ${c.model}`,
  meta: `${c.year} · ${c.badge || 'Available'}`,
  price: c.priceLabel,
  chip: CHIPS[i % CHIPS.length],
}));

export default function DashboardPage() {
  const [hidden, setHidden] = useState(false);
  const { balance, transactions, totalDeposited, totalWithdrawn, portfolio, investments, referralCode, referralCount, referralBonus } = useWallet();
  // Live spot prices, refreshed every 60s. `live` is false when the feed is
  // unreachable and we are showing the fallback values.
  const { coins: market, live: pricesLive } = usePrices();

  const [refLink, setRefLink] = useState('');
  useEffect(() => {
    setRefLink(`${window.location.origin}/register?ref=${referralCode}`);
  }, [referralCode]);

  const [copied, setCopied] = useState(false);
  const copyRef = () => {
    navigator.clipboard?.writeText(refLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  const strip = useRef(null);

  const stats = [
    { label: 'Total Profit', value: fmtMoney(portfolio.totalReturns), note: 'Mining + investments', icon: DollarSign, chip: 'chip-g', noteCls: 'grn' },
    { label: 'Active Capital', value: fmtMoney(portfolio.activeCapital), note: `${portfolio.activeContracts} contracts`, icon: Briefcase, chip: 'chip-y', noteCls: 'yel' },
    { label: 'Total Deposit', value: fmtMoney(totalDeposited), note: 'All time', icon: ArrowDown, chip: 'chip-p', noteCls: 'tert' },
    { label: 'Total Withdrawal', value: fmtMoney(totalWithdrawn), note: 'All time', icon: ArrowUp, chip: 'chip-b', noteCls: 'blut' },
  ];

  return (
    <>
      {/* Balance + stats band */}
      <div className="balance-band mb-6 p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="card flex flex-col">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h2 className="flex items-center text-base font-semibold text-white">
                  <Wallet size={20} className="mr-2" style={{ color: 'var(--blue)' }} /> Account Balance
                </h2>
                <p className="mt-0.5 text-xs mut">Your current available balance</p>
              </div>
              <button onClick={() => setHidden((v) => !v)} className="text-slate-400" aria-label="Toggle balance">
                {hidden ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <div className="flex items-center">
              <h3 className="text-3xl font-semibold text-white">{hidden ? '••••••' : fmtMoney(balance)}</h3>
            </div>
            <div className="pill pill-sec mt-2 w-fit">
              <CheckCircle size={12} /> <span>Available for Withdrawal</span>
            </div>
            <div className="mt-auto flex gap-2 pt-4">
              <Link href="/deposit" className="btn btn-ghost flex-1"><PlusCircle size={14} /> Deposit</Link>
              <Link href="/withdraw" className="btn btn-ghost flex-1"><ArrowUpRight size={14} /> Withdraw</Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:col-span-2">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className={`card card-glow ${glowOf(s.chip)} flex flex-col`}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm mut">{s.label}</span>
                    <span className={`chip ${s.chip} h-8 w-8 rounded-full`}><Icon size={16} /></span>
                  </div>
                  <h3 className="truncate text-lg font-semibold text-white">{s.value}</h3>
                  <div className={`mt-auto flex items-center text-xs ${s.noteCls}`}>
                    <Icon size={12} className="mr-1" /> {s.note}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Market overview */}
          <div className="panel overflow-hidden">
            <div className="flex items-center justify-between p-4 sm:p-5" style={{ borderBottom: '1px solid rgba(148,163,184,.10)' }}>
              <h3 className="flex items-center gap-2 text-base font-semibold text-white">
                Market Overview
                <span className={`pill ${pricesLive ? 'pill-sec' : 'pill-gry'}`}>
                  {pricesLive ? 'Live' : 'Offline'}
                </span>
              </h3>
              <div className="flex gap-2">
                <button onClick={() => strip.current?.scrollBy({ left: -240, behavior: 'smooth' })} className="chip chip-n h-8 w-8 rounded-full" aria-label="Scroll market left"><ChevronRight size={16} className="rotate-180" /></button>
                <button onClick={() => strip.current?.scrollBy({ left: 240, behavior: 'smooth' })} className="chip chip-n h-8 w-8 rounded-full" aria-label="Scroll market right"><ChevronRight size={16} /></button>
              </div>
            </div>
            <div ref={strip} className="flex gap-4 overflow-x-auto p-4 sm:p-5">
              {market.map((m) => (
                <div key={m.sym} className="card min-w-[200px] flex-none">
                  <div className="mb-3 flex items-center gap-2">
                    <img src={m.img} alt={m.name} className="h-8 w-8 rounded-full object-cover" />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-white">{m.name}</div>
                      <div className="text-xs mut">{m.sym}</div>
                    </div>
                    <span className={`pill ml-auto ${m.up ? 'pill-sec' : 'pill-red'}`}>{fmtChange(m.change)}</span>
                  </div>
                  <div className="flex justify-between text-xs"><span className="mut">Price</span><span className="mut">24h</span></div>
                  <div className="flex justify-between"><span className="text-sm font-semibold text-white">{fmtPrice(m.price)}</span><span className={`text-xs ${m.up ? 'grn' : 'redt'}`}>{fmtChange(m.change)}</span></div>
                </div>
              ))}
            </div>
          </div>

          {/* Active plans */}
          <div className="panel overflow-hidden">
            <div className="flex items-center justify-between p-4 sm:p-5" style={{ borderBottom: '1px solid rgba(148,163,184,.10)' }}>
              <h3 className="text-base font-semibold text-white">
                Active Plans <span className="text-xs mut">({investments.filter((i) => i.status === 'active').length})</span>
              </h3>
              <Link href="/invest" className="flex items-center gap-1 text-sm blut">View all <ChevronRight size={16} /></Link>
            </div>
            <div className="p-4 sm:p-5">
              {investments.length === 0 && (
                <div className="py-6 text-center">
                  <p className="text-sm mut">You have no active plans yet.</p>
                  <Link href="/invest" className="btn btn-primary mt-3 inline-flex">Browse plans</Link>
                </div>
              )}
              {investments.slice(0, 4).map((i) => (
                <div key={i.id} className="mb-4 flex items-center gap-3 rounded-xl border p-3 last:mb-0" style={{ borderColor: 'rgba(148,163,184,.10)', background: 'rgba(148,163,184,.03)' }}>
                  <span className="chip chip-b h-10 w-10 rounded-lg"><TrendingUp size={20} /></span>
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-sm font-semibold text-white">{i.planName}</h4>
                    <p className="text-xs mut">{fmtMoney(i.amount)} <span className="faint">· {fmtDay(i.createdAt)} – {fmtDay(i.maturesAt)}</span></p>
                  </div>
                  <span className={`pill ${i.status === 'active' ? 'pill-sec' : 'pill-gry'}`}>
                    {i.status === 'active' ? <CheckCircle size={12} /> : <PauseCircle size={12} />}
                    {i.status === 'active' ? 'Active' : i.status === 'completed' ? 'Matured' : 'Pending'}
                  </span>
                  <Link href="/invest-dashboard" className="chip chip-n h-8 w-8 rounded-full"><ChevronRight size={16} /></Link>
                </div>
              ))}
            </div>
          </div>

          {/* Recent transactions */}
          <div className="panel overflow-hidden">
            <div className="flex items-center justify-between p-4 sm:p-5" style={{ borderBottom: '1px solid rgba(148,163,184,.10)' }}>
              <h3 className="text-base font-semibold text-white">Recent Transactions</h3>
              <Link href="/transactions" className="text-sm blut">View all <ChevronRight size={16} className="inline" /></Link>
            </div>
            <div className="overflow-x-auto">
              <table className="tbl">
                <thead><tr><th>Date</th><th>Type</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
                <tbody>
                  {transactions.slice(0, 6).map((t) => {
                    const Icon = TXN_ICONS[t.icon] || Briefcase;
                    return (
                      <tr key={t.id}>
                        <td className="text-[11px] text-white">{t.date}<div className="text-[10px] faint">ago</div></td>
                        <td>
                          <div className="flex items-center gap-2">
                            <span className={`chip ${t.kind === 'credit' ? 'chip-g' : 'chip-r'} h-8 w-8 rounded-full`}><Icon size={14} /></span>
                            <div><p className="text-xs font-medium text-white sm:text-sm">{t.type}</p><p className="hidden text-xs mut sm:block">{t.sub}</p></div>
                          </div>
                        </td>
                        <td className={`whitespace-nowrap text-right text-xs font-semibold sm:text-sm ${t.kind === 'credit' ? 'grn' : 'redt'}`}>{t.amount > 0 ? '+' : ''}{fmtMoney(t.amount)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Bitcoin live chart */}
          <div className="panel overflow-hidden">
            <div className="flex items-center justify-between p-4 sm:p-5" style={{ borderBottom: '1px solid rgba(148,163,184,.10)' }}>
              <div className="flex items-center gap-2">
                <img src="/assets/coins/btc.png" alt="Bitcoin" className="h-6 w-6 rounded-full object-cover" />
                <h3 className="text-sm font-semibold text-white sm:text-base">Bitcoin (BTC)</h3>
              </div>
              <span className="pill pill-sec">Live</span>
            </div>
            <div className="p-2">
              <TradingViewChart symbol="BINANCE:BTCUSDT" height={200} />
            </div>
          </div>

          {/* Refer & Earn */}
          <div className="panel overflow-hidden">
            <div className="flex items-center justify-between p-4 sm:p-5" style={{ borderBottom: '1px solid rgba(148,163,184,.10)' }}>
              <h3 className="text-sm font-semibold text-white sm:text-base">Refer &amp; Earn</h3>
              <Link href="/account" className="flex items-center gap-1 text-xs blut sm:text-sm">Details <ChevronRight size={16} /></Link>
            </div>
            <div className="p-4 sm:p-5">
              <div className="mb-4 flex gap-3">
                <span className="chip chip-y h-10 w-10 rounded-full"><Users size={20} /></span>
                <div>
                  <h4 className="text-xs font-semibold text-white sm:text-sm">Earn Through Referrals</h4>
                  <p className="text-xs mut">Earn commission when someone signs up using your link</p>
                </div>
              </div>
              <div className="flex overflow-hidden rounded-lg" style={{ background: 'rgba(148,163,184,.10)', border: '1px solid rgba(148,163,184,.16)' }}>
                <input readOnly value={refLink} className="min-w-0 flex-1 bg-transparent px-3 py-2 text-xs text-white focus:outline-none sm:text-sm" />
                <button onClick={copyRef} className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-white" style={{ background: 'linear-gradient(135deg,#2f6dff,#0a54ff)' }}><Copy size={14} /> {copied ? 'Copied' : 'Copy'}</button>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-lg p-3" style={{ background: 'rgba(148,163,184,.10)' }}>
                  <p className="mb-1 text-xs mut">Total Referrals</p>
                  <p className="text-lg font-semibold text-white">{referralCount}</p>
                </div>
                <div className="rounded-lg p-3" style={{ background: 'rgba(148,163,184,.10)' }}>
                  <p className="mb-1 text-xs mut">Earnings</p>
                  <p className="text-lg font-semibold text-white">{fmtMoney(referralBonus)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Inventory */}
          <div className="panel overflow-hidden">
            <div className="flex items-center justify-between p-4 sm:p-5" style={{ borderBottom: '1px solid rgba(148,163,184,.10)' }}>
              <h3 className="text-sm font-semibold text-white sm:text-base">Inventory</h3>
              <Link href="/inventory" className="flex items-center gap-1 text-xs blut sm:text-sm">Browse all <ChevronRight size={16} /></Link>
            </div>
            <div className="p-2">
              {INVENTORY.map((v) => (
                <Link key={v.slug} href={`/inventory/${v.slug}`} className="flex items-center gap-3 rounded-lg p-3 hover:bg-white/5">
                  <span className={`chip ${v.chip} h-10 w-10 rounded-lg`}><Car size={20} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-white">{v.name}</span>
                    <span className="block text-xs mut">{v.meta}</span>
                  </span>
                  <span className="text-sm font-semibold text-white">{v.price}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
