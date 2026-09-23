'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Wallet, Lock, Check, FileText } from 'lucide-react';
import { findCar } from '@/lib/cars';
import { useWallet, fmtMoney } from '@/lib/wallet';

export default function CarCheckoutPage() {
  const { slug } = useParams();
  const car = findCar(slug);
  const { balance, purchase } = useWallet();

  const [color, setColor] = useState('Pearl White');
  const [receipt, setReceipt] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    try { const c = localStorage.getItem('carColor'); if (c) setColor(c); } catch (e) {}
  }, []);

  const remaining = balance - car.price;
  const insufficient = balance < car.price;

  // Waits for the order to be recorded before showing the receipt — the
  // previous fire-and-forget call could report success on a purchase that was
  // never written.
  const completeOrder = async () => {
    if (insufficient || busy) return;
    setBusy(true);
    setErr(null);
    const d = await purchase(car.price, car.category ? `${car.category} Purchase` : 'Vehicle Purchase', car.name, { ref: car.slug });
    setBusy(false);
    if (d?.ok) setReceipt(d.order);
    else setErr(d?.error || 'Could not complete this order.');
  };

  return (
    <>
      <Link href={`/inventory/${car.slug}`} className="mb-4 inline-flex items-center text-xs font-medium mut hover-tx">
        <ArrowLeft size={14} className="mr-1" /> Back to Order
      </Link>

      <div className="panel relative mb-6 p-6">
        <div>
          <h1 className="mb-1 text-xl font-light hi">Checkout</h1>
          <p className="text-sm mut">Complete your order</p>
        </div>
      </div>

      {receipt ? (
        <div className="panel mx-auto max-w-md p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full" style={{ background: 'var(--ok-bg)' }}>
            <Check size={28} className="grn" />
          </div>
          <h3 className="mb-1 text-lg font-medium hi">Order placed</h3>
          <p className="mb-2 text-sm mut">You paid <span className="font-medium grn">{fmtMoney(car.price)}</span> from your main balance.</p>
          <p className="mb-5 font-mono text-xs mut">Receipt {receipt.receiptId}</p>
          <Link href={`/receipt/${receipt.receiptId}`} className="btn btn-pri w-full py-3">
            <FileText size={16} /> View Receipt
          </Link>
          <div className="mt-3 flex gap-3">
            <Link href="/transactions" className="btn btn-ghost flex-1">Transactions</Link>
            <Link href="/inventory" className="btn btn-ghost flex-1">Inventory</Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left: contact + billing + payment */}
          <div className="space-y-6 lg:col-span-2">
            <div className="panel p-6">
              <div className="mb-4 flex items-center">
                <Step n={1} />
                <h2 className="text-base font-medium hi">Contact Information</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Full name"><input className="inp" placeholder="Wilson" /></Field>
                <Field label="Email address"><input className="inp" type="email" placeholder="you@example.com" /></Field>
              </div>
            </div>

            <div className="panel p-6">
              <div className="mb-4 flex items-center">
                <Step n={2} />
                <h2 className="text-base font-medium hi">Billing Address</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2"><Field label="Street address"><input className="inp" placeholder="1 Innovation Drive" /></Field></div>
                <Field label="City"><input className="inp" placeholder="Austin" /></Field>
                <Field label="State / Province"><input className="inp" placeholder="Texas" /></Field>
                <Field label="ZIP / Postal code"><input className="inp" inputMode="numeric" placeholder="78725" /></Field>
                <Field label="Country">
                  <select className="inp">
                    {['United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 'France', 'United Arab Emirates', 'Nigeria', 'South Africa', 'Other'].map((c) => <option key={c}>{c}</option>)}
                  </select>
                </Field>
              </div>
            </div>

            <div className="panel p-6">
              <div className="mb-4 flex items-center">
                <Step n={3} />
                <h2 className="text-base font-medium hi">Payment Method</h2>
              </div>
              <div className="flex items-start gap-3 rounded-xl border p-4" style={{ borderColor: 'var(--ok-bg)', background: 'var(--ok-bg)' }}>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ background: 'var(--hairline)' }}>
                  <Wallet size={20} className="grn" />
                </div>
                <div>
                  <p className="text-sm font-medium grn">Main balance</p>
                  <p className="mt-0.5 text-xs grn">This order is paid directly from your main balance. No crypto payment needed.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: order summary */}
          <div className="lg:col-span-1">
            <div className="panel p-6 lg:sticky lg:top-4">
              <h2 className="mb-4 text-base font-medium hi">Order Summary</h2>

              <div className="mb-4 flex items-center gap-3">
                <img src={car.image} alt={car.name} className="h-16 w-24 shrink-0 rounded-xl object-cover" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium hi">{car.name}</p>
                  <p className="text-xs mut">{car.year} Tesla {car.model}</p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="mut">{car.category ? 'Product price' : 'Vehicle price'}</span><span className="font-medium hi">{car.priceLabel}</span></div>
                {!car.category && <div className="flex justify-between"><span className="mut">Exterior color</span><span className="font-medium hi">{color}</span></div>}
                <div className="flex justify-between"><span className="mut">Est. delivery</span><span className="mut">2-4 weeks</span></div>
                <div className="flex justify-between border-t pt-3 font-medium hi" style={{ borderColor: 'var(--hairline)' }}>
                  <span>Total due</span><span>{car.priceLabel}</span>
                </div>
                <div className="flex justify-between border-t pt-3" style={{ borderColor: 'var(--hairline)' }}>
                  <span className="mut">Wallet balance</span><span className="font-medium hi">{fmtMoney(balance)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="mut">After order</span>
                  <span className={`font-medium ${remaining < 0 ? 'redt' : 'hi'}`}>{fmtMoney(remaining)}</span>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs mut" style={{ borderColor: 'var(--hairline)', background: 'var(--soft)' }}>
                <Lock size={14} /> <span>The amount is debited from your main balance.</span>
              </div>

              {insufficient && (
                <p className="mt-4 rounded-xl border p-3 text-xs font-medium" style={{ borderColor: 'rgba(255,107,107,.3)', background: 'rgba(255,107,107,.08)', color: '#ff9494' }}>
                  Insufficient balance — <Link href="/deposit" className="underline">deposit funds</Link> to place this order.
                </p>
              )}

              {err && (
                <p className="mt-4 rounded-xl border p-3 text-xs font-medium" style={{ borderColor: 'rgba(255,107,107,.3)', background: 'rgba(255,107,107,.08)', color: '#ff9494' }}>
                  {err}
                </p>
              )}

              <button
                onClick={completeOrder}
                disabled={insufficient || busy}
                className={`btn btn-pri mt-5 w-full py-3 ${insufficient || busy ? 'opacity-50' : ''}`}
              >
                {busy ? 'Processing…' : 'Complete Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Step({ n }) {
  return (
    <span className="mr-2 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-medium hi" style={{ background: 'var(--primary)' }}>
      {n}
    </span>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium mut">{label}</label>
      {children}
    </div>
  );
}
