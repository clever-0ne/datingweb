'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowUpFromLine, ShieldCheck, Check } from 'lucide-react';
import { useCoins, pickCoin } from '@/lib/useCoins';
import { useWallet, fmtMoney } from '@/lib/wallet';
import { MoneyInput } from '@/lib/locale';
import WithdrawOtpField from '@/components/WithdrawOtpField';

// The coins /api/withdrawals accepts.
const WITHDRAW_COINS = ['btc', 'eth', 'usdt', 'sol'];

export default function WithdrawCheckout({ backHref = '/withdraw' }) {
  const { balance, withdraw } = useWallet();
  // Same source as the deposit screens, so the two never disagree about which
  // networks are on offer.
  const coins = useCoins().filter((c) => WITHDRAW_COINS.includes(c.id));
  const [amount, setAmount] = useState(500);
  const [coinId, setCoinId] = useState('btc');
  const [address, setAddress] = useState('');
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');

  const submit = async () => {
    setErr('');
    if (amount < 10) { setErr(`Minimum withdrawal is ${fmtMoney(10)}.`); return; }
    if (!address.trim()) { setErr('Please enter a destination wallet address.'); return; }
    if (otp.length !== 6) { setErr('Send yourself a code and enter the 6 digits from your email.'); return; }
    setBusy(true);
    const d = await withdraw(amount, pickCoin(coins, coinId)?.id, address.trim(), otp);
    setBusy(false);
    if (d?.ok) setDone(true);
    else setErr(d?.error || 'Something went wrong. Please try again.');
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
              <MoneyInput usd={amount} onUsd={setAmount} className="inp py-3 text-lg" placeholder="0.00" />
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

            <WithdrawOtpField value={otp} onChange={setOtp} />

            {err && <p className="mb-4 rounded-lg border p-3 text-xs font-medium" style={{ borderColor: 'rgba(255,107,107,.3)', background: 'rgba(255,107,107,.1)', color: '#ff9494' }}>{err}</p>}

            <button onClick={submit} disabled={busy} className="btn btn-sec flex w-full py-4 disabled:opacity-60"><ArrowUpFromLine size={20} /> {busy ? 'Submitting…' : 'Complete Request'}</button>
            <p className="mt-3 text-center text-xs faint">Withdrawals require an emailed verification code and are processed Monday-Friday.</p>
          </div>
        </div>
      )}

    </>
  );
}
