'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Wallet, Lock, Check } from 'lucide-react';
import { useWallet, fmtMoney } from '@/lib/wallet';

export default function BalancePurchase({ name = 'Investment', price = 100, backHref = '/invest', meta = 'Plan purchase' }) {
  const { balance, purchase } = useWallet();
  const [done, setDone] = useState(false);

  const remaining = balance - price;
  const insufficient = balance < price;

  const complete = () => {
    if (insufficient) return;
    purchase(price, 'Investment Purchase', name);
    setDone(true);
  };

  if (done) {
    return (
      <div className="panel mx-auto max-w-md p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full" style={{ background: 'rgba(47,138,104,.16)' }}>
          <Check size={28} className="grn" />
        </div>
        <h3 className="mb-1 text-lg font-medium text-white">Purchase complete</h3>
        <p className="mb-2 text-sm mut">You paid <span className="font-medium grn">{fmtMoney(price)}</span> from your main balance.</p>
        <Link href={backHref} className="btn btn-pri mt-4 w-full">Back</Link>
      </div>
    );
  }

  return (
    <>
      <Link href={backHref} className="mb-4 inline-flex items-center text-xs font-medium text-slate-400 hover:text-white">
        <ArrowLeft size={14} className="mr-1" /> Back
      </Link>

      <div className="panel relative mb-6 p-6">
        <h1 className="mb-1 text-xl font-light text-white">Checkout</h1>
        <p className="text-sm mut">Complete your purchase</p>
      </div>

      <div className="panel mx-auto max-w-lg overflow-hidden">
        <div className="border-b p-5" style={{ borderColor: 'rgba(148,163,184,.10)' }}>
          <h2 className="text-base font-semibold text-white">Order Summary</h2>
        </div>
        <div className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">{name}</p>
              <p className="text-xs mut">{meta}</p>
            </div>
            <span className="text-lg font-semibold text-white">{fmtMoney(price)}</span>
          </div>

          <div className="space-y-2 border-t pt-3 text-sm" style={{ borderColor: 'rgba(148,163,184,.12)' }}>
            <div className="flex justify-between"><span className="mut">Total due</span><span className="font-medium text-white">{fmtMoney(price)}</span></div>
            <div className="flex justify-between"><span className="mut">Wallet balance</span><span className="font-medium text-white">{fmtMoney(balance)}</span></div>
            <div className="flex justify-between"><span className="mut">After purchase</span><span className={`font-medium ${remaining < 0 ? 'redt' : 'text-white'}`}>{fmtMoney(remaining)}</span></div>
          </div>

          <div className="mt-5 flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs mut" style={{ borderColor: 'rgba(148,163,184,.12)', background: 'rgba(148,163,184,.05)' }}>
            <Lock size={14} /> <span>The amount is debited from your main balance.</span>
          </div>

          {insufficient && (
            <p className="mt-4 rounded-xl border p-3 text-xs font-medium" style={{ borderColor: 'rgba(255,107,107,.3)', background: 'rgba(255,107,107,.08)', color: '#ff9494' }}>
              Insufficient balance — <Link href="/deposit" className="underline">deposit funds</Link> to complete this purchase.
            </p>
          )}

          <button onClick={complete} disabled={insufficient} className={`btn btn-pri mt-5 w-full py-3 ${insufficient ? 'opacity-50' : ''}`}>
            <Wallet size={16} /> Complete Purchase
          </button>
        </div>
      </div>
    </>
  );
}
