'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowUpFromLine, ShieldCheck, Check, X, Mail } from 'lucide-react';
import { useCoins, pickCoin } from '@/lib/useCoins';
import { useWallet, fmtMoney } from '@/lib/wallet';

export default function WithdrawCheckout({ backHref = '/withdraw' }) {
  const { balance, withdraw } = useWallet();
  // Same source as the deposit screens, so the two never disagree about which
  // networks are on offer.
  const coins = useCoins();
  const [amount, setAmount] = useState(500);
  const [coinId, setCoinId] = useState('btc');
  const [address, setAddress] = useState('');
  const [otp, setOtp] = useState(null);
  const [otpInput, setOtpInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [pin, setPin] = useState('');
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');

  const requestOtp = () => {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setOtp(code);
    setErr('');
  };

  const submit = () => {
    setErr('');
    if (amount < 10) { setErr('Minimum withdrawal is $10.00.'); return; }
    if (!address.trim()) { setErr('Please enter a destination wallet address.'); return; }
    if (!otp) { setErr('Request an OTP first — an auth key is required to withdraw.'); return; }
    if (otpInput !== otp) { setErr('Invalid OTP. Enter the 6-digit code sent to your email.'); return; }
    setShowPin(true);
  };

  const confirmPin = () => {
    if (pin.length < 4) { setErr('Enter your 4-digit withdrawal PIN.'); return; }
    const c = pickCoin(coins, coinId);
    withdraw(amount, 'Withdrawal', c.name + ' · ' + c.network);
    setShowPin(false);
    setDone(true);
  };

  return (
    <>
      <div className="relative mb-6 overflow-hidden rounded-3xl p-6 sm:p-8" style={{ background: 'linear-gradient(120deg,var(--ok-bg),rgba(98,126,234,.14))', border: '1px solid var(--hairline-strong)' }}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Link href={backHref} className="mb-3 inline-flex items-center gap-1 text-xs mut hover-tx"><ArrowLeft size={14} /> Back</Link>
            <h1 className="text-2xl font-bold hi sm:text-3xl">Withdraw Funds</h1>
            <p className="mt-1 text-sm mut">Request a withdrawal to your wallet</p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border p-3" style={{ background: 'var(--soft)', borderColor: 'var(--hairline-strong)' }}>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl text-white" style={{ background: 'linear-gradient(135deg, var(--secondary), var(--primary-2))' }}>
              <ArrowUpFromLine size={20} />
            </div>
            <div>
              <p className="text-xs mut">Available Balance</p>
              <p className="text-xl font-bold hi">{fmtMoney(balance)}</p>
            </div>
          </div>
        </div>
      </div>

      {done ? (
        <div className="panel mx-auto max-w-md p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: 'var(--ok-bg)' }}>
            <Check size={32} className="grn" />
          </div>
          <h3 className="mb-2 text-xl font-bold hi">Withdrawal Submitted</h3>
          <p className="mb-6 text-sm mut">Your withdrawal request is pending admin approval and will be processed within 24-72 hours.</p>
          <Link href={backHref} className="btn btn-pri w-full">Done</Link>
        </div>
      ) : (
        <div className="panel mx-auto max-w-2xl overflow-hidden">
          <div className="flex items-center gap-3 border-b p-6" style={{ borderColor: 'var(--soft)' }}>
            <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: 'var(--ok-bg)' }}>
              <ShieldCheck size={20} className="grn" />
            </div>
            <div>
              <p className="text-sm mut">Secure withdrawal</p>
              <p className="text-lg font-semibold hi">Withdrawal Details</p>
            </div>
          </div>

          <div className="p-6">
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium hi">Amount to withdraw (USD)</label>
              <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value) || 0)} className="inp py-3 text-lg" placeholder="0.00" />
            </div>

            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium hi">Withdrawal method</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {coins.map((c) => (
                  <button key={c.id} onClick={() => setCoinId(c.id)} className={`rounded-xl border p-2.5 text-center transition ${coinId === c.id ? 'border-[color:var(--secondary)] bg-[var(--ok-bg)]' : 'border-[var(--soft-2)] hover:border-[var(--hairline-strong)]'}`}>
                    <img src={c.icon} alt={c.name} className="mx-auto mb-1 h-7 w-7 rounded-full" />
                    <p className="text-sm font-medium hi">{c.symbol}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium hi">Destination wallet address</label>
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="inp" placeholder="Enter your wallet address" />
            </div>

            {/* Auth key (OTP) */}
            <div className="mb-4 rounded-xl border p-4" style={{ borderColor: 'rgba(240,185,11,.3)', background: 'rgba(240,185,11,.06)' }}>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium hi">Auth Key (OTP)</span>
                <button onClick={requestOtp} className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-white" style={{ background: 'linear-gradient(135deg, var(--secondary), var(--secondary))' }}>
                  <Mail size={12} /> Request OTP
                </button>
              </div>
              {otp && <p className="mb-2 text-xs grn">Auth key issued — <span className="font-mono font-bold">{otp}</span></p>}
              <input type="text" maxLength={6} value={otpInput} onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))} className="inp text-center tracking-[0.5em]" placeholder="••••••" />
              <p className="mt-1 text-xs mut">A one-time auth key is required to withdraw. It expires in 5 minutes.</p>
            </div>

            {err && <p className="mb-4 rounded-lg border p-3 text-xs font-medium" style={{ borderColor: 'rgba(255,107,107,.3)', background: 'rgba(255,107,107,.1)', color: '#ff9494' }}>{err}</p>}

            <button onClick={submit} className="btn btn-sec flex w-full py-4"><ArrowUpFromLine size={20} /> Complete Request</button>
            <p className="mt-3 text-center text-xs faint">Withdrawals require OTP + PIN verification and are processed Monday-Friday.</p>
          </div>
        </div>
      )}

      {/* PIN modal */}
      {showPin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,.6)' }}>
          <div className="w-full max-w-md overflow-hidden rounded-2xl border bg-[var(--chrome)]" style={{ borderColor: 'var(--hairline-strong)' }}>
            <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: 'var(--hairline)' }}>
              <h3 className="text-lg font-medium hi">Security Verification</h3>
              <button onClick={() => setShowPin(false)} className="mut hover-tx"><X size={20} /></button>
            </div>
            <div className="px-6 py-4">
              <label className="mb-2 block text-sm font-medium hi">Withdrawal PIN</label>
              <input type="password" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} className="inp py-3 text-center text-lg tracking-[0.5em]" placeholder="••••" />
              <p className="mt-1 text-xs mut">Enter your 4-digit withdrawal PIN to confirm.</p>
              {err && <p className="mt-3 text-xs font-medium" style={{ color: '#ff9494' }}>{err}</p>}
              <div className="mt-4 flex justify-end gap-3">
                <button onClick={() => setShowPin(false)} className="btn btn-ghost">Cancel</button>
                <button onClick={confirmPin} className="btn btn-pri">Confirm</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
