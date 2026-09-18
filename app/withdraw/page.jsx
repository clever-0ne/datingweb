'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Wallet, DollarSign, Clock, ArrowUpFromLine, Search, ListChecks, ShieldCheck, FileText, Check } from 'lucide-react';
import { useWallet, fmtMoney } from '@/lib/wallet';

const METHODS = [
  { id: 'btc', name: 'Bitcoin', network: 'BTC network', icon: '/assets/coins/btc.png' },
  { id: 'eth', name: 'Ethereum', network: 'ERC-20', icon: '/assets/coins/eth.png' },
  { id: 'usdt', name: 'Tether', network: 'TRC-20', icon: '/assets/coins/usdt.png' },
  { id: 'sol', name: 'Solana', network: 'Solana', icon: '/assets/coins/sol.png' },
];

export default function WithdrawPage() {
  const [method, setMethod] = useState('btc');
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);
  const { balance, totalWithdrawn, transactions, withdraw } = useWallet();
  const last = transactions.find((t) => t.type === 'Withdrawal');
  const pendingWithdrawals = transactions
    .filter((t) => t.type === 'Withdrawal' && t.status === 'pending')
    .reduce((s, t) => s + Math.abs(t.amount), 0);

  const submitWithdrawal = async (e) => {
    e.preventDefault();
    setNotice(null);
    setSubmitting(true);
    const d = await withdraw(amount, method, address);
    setSubmitting(false);
    if (d?.ok) {
      setAmount('');
      setAddress('');
      setNotice({ kind: 'ok', text: 'Withdrawal request submitted — pending admin approval.' });
    } else {
      setNotice({ kind: 'err', text: d?.error || 'Something went wrong. Please try again.' });
    }
  };

  const CARDS = [
    { label: 'Available Balance', value: fmtMoney(balance), icon: Wallet, chip: 'chip-b' },
    { label: 'Total Withdrawn', value: fmtMoney(totalWithdrawn), icon: DollarSign, chip: 'chip-g' },
    { label: 'Pending Withdrawals', value: fmtMoney(pendingWithdrawals), icon: Clock, chip: 'chip-p' },
    { label: 'Last Withdrawal', value: last ? fmtMoney(Math.abs(last.amount)) : '$0.00', icon: ArrowUpFromLine, chip: 'chip-y' },
  ];

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="flex items-center text-xl font-bold hi"><ArrowUpFromLine size={24} className="mr-2 blut" /> Withdrawals</h1>
        <div className="hidden gap-2 md:flex">
          <Link href="/transactions" className="btn btn-ghost">Withdrawal History</Link>
          <a href="#form" className="btn btn-pri">New Request</a>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        {CARDS.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide faint">{c.label}</p>
                  <p className="mt-1 text-xl font-bold hi">{c.value}</p>
                </div>
                <div className={`chip ${c.chip} h-10 w-10 rounded-lg`}><Icon size={20} /></div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="panel overflow-hidden">
        <div className="border-b p-5" style={{ borderColor: 'var(--soft)' }}>
          <h2 className="text-base font-bold hi">Select Withdrawal Method</h2>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4" style={{ borderColor: 'var(--soft)', background: 'var(--soft)' }}>
          <div className="flex items-center gap-2">
            <span className="btn btn-pri" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>All Methods</span>
            <span className="rounded-lg px-3 py-1.5 text-xs font-medium" style={{ background: 'var(--soft-2)', color: '#aab4c8' }}>Crypto</span>
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 faint" />
            <input placeholder="Search payment methods..." className="w-full rounded-lg border py-1.5 pl-9 pr-4 text-sm md:w-60" style={{ background: 'var(--field)', borderColor: 'var(--hairline-strong)', color: 'var(--text)' }} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>Method</th><th style={{ textAlign: 'right' }}>Action</th></tr></thead>
            <tbody>
              {METHODS.map((m) => (
                <tr key={m.id} className="text-sm">
                  <td className="py-4">
                    <div className="flex items-center">
                      <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-lg p-1.5" style={{ background: 'var(--hairline)' }}>
                        <img src={m.icon} alt={m.name} className="h-full w-full object-contain" />
                      </div>
                      <p className="font-medium hi">{m.name}</p>
                    </div>
                  </td>
                  <td className="py-4 text-right"><button className="btn btn-pri" style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem' }} onClick={() => setMethod(m.id)}>Withdraw</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div id="form" className="panel mt-6 overflow-hidden">
        <div className="border-b p-5" style={{ borderColor: 'var(--soft)' }}>
          <h2 className="flex items-center text-base font-bold hi"><ArrowUpFromLine size={20} className="mr-2 blut" /> Withdrawal Details</h2>
        </div>
        <form className="p-6" onSubmit={submitWithdrawal}>
          <div className="mb-4 flex items-center justify-between">
            <label className="text-sm font-medium hi">Amount to withdraw</label>
            <span className="text-xs faint">Available: <span className="font-medium hi">{fmtMoney(balance)}</span></span>
          </div>
          <div className="relative mb-4">
            <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center hi">$</span>
            <input
              type="number"
              min="10"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="block w-full rounded-xl border py-3 pl-10 pr-12 text-lg"
              style={{ background: 'var(--field)', borderColor: 'var(--hairline-strong)', color: 'var(--text)' }}
            />
          </div>
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium hi">Withdrawal method</label>
            <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full rounded-xl border px-3 py-3 text-sm" style={{ background: 'var(--field)', borderColor: 'var(--hairline-strong)', color: 'var(--text)' }}>
              {METHODS.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.network})</option>)}
            </select>
          </div>
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium hi">Destination wallet address</label>
            <input
              type="text"
              placeholder="Enter your wallet address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="block w-full rounded-xl border px-4 py-3 text-sm"
              style={{ background: 'var(--field)', borderColor: 'var(--hairline-strong)', color: 'var(--text)' }}
            />
          </div>

          {notice && (
            <p className={`mb-4 rounded-xl px-3 py-2 text-xs font-medium ${notice.kind === 'ok' ? 'bg-[var(--ok-bg)] text-[var(--ok-text)]' : 'bg-[var(--bad-bg)] text-[var(--bad-text)]'}`}>
              {notice.text}
            </p>
          )}

          <button type="submit" disabled={submitting} className="btn btn-pri flex w-full py-4 disabled:opacity-60">
            <ArrowUpFromLine size={20} /> {submitting ? 'Submitting…' : 'Submit Withdrawal'}
          </button>
          <p className="mt-3 text-center text-xs faint">Withdrawals are debited from your balance once approved by an admin.</p>
        </form>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="panel overflow-hidden">
          <div className="flex items-center border-b p-4" style={{ borderColor: 'var(--soft)' }}>
            <ListChecks size={20} className="mr-2 blut" /><h3 className="text-base font-medium hi">Withdrawal Process</h3>
          </div>
          <div className="p-5">
            <ol className="relative ml-3 space-y-6 border-l" style={{ borderColor: 'var(--hairline-strong)' }}>
              {['Select Method', 'Enter Details', 'Confirmation', 'Processing'].map((s, i) => (
                <li key={s} className="ml-6">
                  <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full ring-4" style={{ background: 'rgba(10,84,255,.16)', color: '#8db2ff' }}><span className="text-xs font-bold">{i + 1}</span></span>
                  <h3 className="font-medium hi">{s}</h3>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <div className="panel overflow-hidden">
          <div className="flex items-center border-b p-4" style={{ borderColor: 'var(--soft)' }}>
            <ShieldCheck size={20} className="mr-2 yel" /><h3 className="text-base font-medium hi">Security Tips</h3>
          </div>
          <div className="space-y-3 p-5">
            {['Always verify withdrawal addresses.', 'Enable two-factor authentication (2FA).', 'Confirm network type for crypto.', 'Start with small test withdrawals.'].map((t) => (
              <div key={t} className="flex"><span className="chip chip-y mr-3 h-5 w-5 rounded-full"><Check size={12} /></span><p className="text-xs mut">{t}</p></div>
            ))}
          </div>
        </div>
        <div className="panel overflow-hidden">
          <div className="flex items-center border-b p-4" style={{ borderColor: 'var(--soft)' }}>
            <FileText size={20} className="mr-2 grn" /><h3 className="text-base font-medium hi">Withdrawal Policy</h3>
          </div>
          <div className="space-y-4 p-5">
            <Row k="Processing Time" v="24-72 hours" />
            <Row k="Minimum Withdrawal" v="$10.00" />
            <Row k="Daily Limit" v={fmtMoney(balance)} />
            <Row k="Processing Days" v="Monday-Friday" />
          </div>
        </div>
      </div>
    </>
  );
}

function Row({ k, v }) {
  return (
    <div className="flex items-center justify-between">
      <h4 className="text-sm font-medium hi">{k}</h4>
      <span className="text-xs font-medium hi">{v}</span>
    </div>
  );
}
