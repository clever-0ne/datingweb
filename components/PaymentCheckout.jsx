'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CreditCard, Copy, Check, Info, QrCode, ArrowLeft, ArrowDownToLine, ArrowUpRight, Car, TrendingUp } from 'lucide-react';
import { fmt } from '@/lib/coins';
import { useCoins, pickCoin } from '@/lib/useCoins';
import { useWallet } from '@/lib/wallet';

const KIND_ICON = {
  deposit: ArrowDownToLine,
  withdraw: ArrowUpRight,
  vehicle: Car,
  investment: TrendingUp,
};

export default function PaymentCheckout({ kind = 'deposit', context = 'Deposit', defaultAmount = 500, backHref = '/deposit' }) {
  const [amount, setAmount] = useState(defaultAmount);
  const [coinId, setCoinId] = useState('btc');
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);

  // The address and rate below come from the admin's console settings, not from
  // the static list — otherwise this page would keep quoting an address the
  // admin has already changed.
  const coins = useCoins();
  const coin = pickCoin(coins, coinId);
  const coinAmount = amount / (coin?.rate || 1);

  const copyAddress = () => {
    if (!coin.address) return;
    const done2 = () => { setCopied(true); setTimeout(() => setCopied(false), 1500); };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(coin.address).then(done2, done2);
    else done2();
  };

  const Icon = KIND_ICON[kind] || ArrowDownToLine;
  const { deposit, purchase } = useWallet();

  const confirmPayment = () => {
    const note = coin.name + ' · ' + coin.network;
    if (kind === 'deposit') deposit(amount, 'Deposit', note);
    else purchase(amount, context, note);
    setDone(true);
  };

  return (
    <>
      {/* Header */}
      <div className="relative mb-6 overflow-hidden rounded-3xl p-6 sm:p-8" style={{ background: 'linear-gradient(120deg,rgba(10,84,255,.18),rgba(47,138,104,.18))', border: '1px solid rgba(148,163,184,.16)' }}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Link href={backHref} className="mb-3 inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white"><ArrowLeft size={14} /> Back</Link>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">Make Payment</h1>
            <p className="mt-1 text-sm mut">Complete your payment process</p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border p-3" style={{ background: 'rgba(10,14,24,.4)', borderColor: 'rgba(148,163,184,.16)' }}>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl text-white" style={{ background: 'linear-gradient(135deg,#2f6dff,#2f8a68)' }}>
              <Icon size={20} />
            </div>
            <div>
              <p className="text-xs mut">Payment Amount</p>
              <p className="text-xl font-bold text-white">{fmt(amount)}</p>
            </div>
          </div>
        </div>
      </div>

      {done ? (
        <div className="panel mx-auto max-w-md p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: 'rgba(47,138,104,.16)' }}>
            <Check size={32} className="grn" />
          </div>
          <h3 className="mb-2 text-xl font-bold text-white">Payment Submitted</h3>
          <p className="mb-6 text-sm mut">Your {context.toLowerCase()} is being processed. The system will track your payment and update your account automatically.</p>
          <Link href={backHref} className="btn btn-pri w-full">Done</Link>
        </div>
      ) : (
        <div className="panel mx-auto max-w-4xl overflow-hidden">
          {/* Method header */}
          <div className="flex items-center gap-3 border-b p-6" style={{ borderColor: 'rgba(148,163,184,.10)' }}>
            <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: 'rgba(240,185,11,.15)' }}>
              <CreditCard size={20} className="yel" />
            </div>
            <div>
              <p className="text-sm mut">Your payment method</p>
              <p className="text-lg font-semibold text-white">{coin.name} · {context}</p>
            </div>
          </div>

          <div className="p-6">
            {/* Coin selector + amount */}
            <div className="mb-6 rounded-xl border p-4 text-center" style={{ borderColor: 'rgba(148,163,184,.12)', background: 'rgba(148,163,184,.05)' }}>
              <p className="text-white">You are to make payment of <span className="font-bold">{fmt(amount)}</span> using your selected method.</p>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {coins.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCoinId(c.id)}
                  className={`rounded-xl border p-3 text-center transition ${coinId === c.id ? 'border-[#2f6dff] bg-[rgba(10,84,255,.15)]' : 'border-[rgba(148,163,184,.15)] hover:border-[rgba(148,163,184,.35)]'}`}
                >
                  <img src={c.icon} alt={c.name} className="mx-auto mb-1 h-8 w-8 rounded-full" />
                  <p className="text-sm font-medium text-white">{c.symbol}</p>
                  <p className="text-xs mut">{c.network}</p>
                </button>
              ))}
            </div>

            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-white">Amount (USD)</label>
              <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value) || 0)} className="inp py-3 text-lg" />
              <p className="mt-2 text-xs mut">
                ≈ <span className="font-mono text-white">{coinAmount >= 1 ? coinAmount.toFixed(4) : coinAmount.toFixed(8)}</span> {coin.symbol}
              </p>
            </div>

            {/* Address */}
            <div className="mb-4">
              <h3 className="mb-2 text-lg font-semibold text-white">{coin.name} Address:</h3>
              <div className="flex items-center justify-between gap-2 rounded-xl border border-dashed px-3 py-2.5" style={{ borderColor: 'rgba(148,163,184,.3)' }}>
                <span className="truncate font-mono text-xs text-white">
                  {coin.address || 'Awaiting deposit address from support'}
                </span>
                <button type="button" onClick={copyAddress} disabled={!coin.address} className="flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-medium disabled:opacity-50" style={{ background: 'rgba(148,163,184,.12)', color: '#e6ecf6' }}>
                  {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="mt-1 text-sm mut"><span className="font-semibold text-white">Network Type:</span> {coin.network}</p>
            </div>

            {/* QR placeholder */}
            <div className="mb-6 flex justify-center">
              <div className="relative rounded-xl border-2 p-4" style={{ borderColor: 'rgba(240,185,11,.5)' }}>
                <div className="absolute -right-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full text-white" style={{ background: 'var(--accent)' }}>
                  <QrCode size={16} />
                </div>
                <div className="flex h-[200px] w-[200px] items-center justify-center rounded-lg" style={{ background: 'rgba(148,163,184,.08)' }}>
                  <QrCode size={120} className="text-slate-500" />
                </div>
              </div>
            </div>

            {/* Steps */}
            <div className="rounded-xl border p-5" style={{ borderColor: 'rgba(148,163,184,.12)' }}>
              <h4 className="mb-4 font-semibold text-white">How to Complete Your Payment</h4>
              <ol className="space-y-3">
                {['Open your cryptocurrency wallet application', 'Select "Send" or "Pay" in your wallet app', 'Scan the QR code or paste the address shown above', `Enter the exact amount: ${fmt(amount)}`, 'Confirm and send the transaction'].map((s, i) => (
                  <li key={i} className="flex items-start">
                    <span className="mr-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ background: 'rgba(10,84,255,.16)', color: '#8db2ff' }}>{i + 1}</span>
                    <p className="text-sm mut">{s}</p>
                  </li>
                ))}
              </ol>
            </div>

            <div className="mt-4 flex items-center rounded-xl border p-3" style={{ borderColor: 'rgba(98,126,234,.3)', background: 'rgba(98,126,234,.08)' }}>
              <Info size={16} className="mr-2 shrink-0 tert" />
              <p className="text-xs mut">You can exit this page after completing payment. The system will track your payment and update your account automatically.</p>
            </div>

            <button onClick={confirmPayment} className="btn btn-pri mt-6 flex w-full py-4"><Check size={20} /> I&apos;ve sent the payment</button>
          </div>
        </div>
      )}
    </>
  );
}
