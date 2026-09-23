'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Wallet, DollarSign, Clock, ArrowDownToLine, Search, PlusCircle, ListChecks, ShieldCheck, FileText, Check, Copy } from 'lucide-react';
import { useWallet, fmtMoney } from '@/lib/wallet';
import { useCoins, pickCoin } from '@/lib/useCoins';

export default function DepositPage() {
  const [method, setMethod] = useState('btc');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);
  const [copied, setCopied] = useState(false);
  const { balance, totalDeposited, transactions, deposit } = useWallet();

  // Live addresses/rates the admin has configured in the console.
  const coins = useCoins();
  const coin = pickCoin(coins, method);
  const last = transactions.find((t) => t.type === 'Deposit');
  const pendingDeposits = transactions
    .filter((t) => t.type === 'Deposit' && t.status === 'pending')
    .reduce((s, t) => s + t.amount, 0);

  const copyAddress = () => {
    if (!coin?.address) return;
    const done = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(coin.address).then(done, done);
    else done();
  };

  const submitDeposit = async (e) => {
    e.preventDefault();
    setNotice(null);
    setSubmitting(true);
    const d = await deposit(amount, coin.id);
    setSubmitting(false);
    if (d?.ok) {
      setAmount('');
      setNotice({ kind: 'ok', text: 'Transfer received — your deposit is pending admin approval.' });
    } else {
      setNotice({ kind: 'err', text: d?.error || 'Something went wrong. Please try again.' });
    }
  };

  const CARDS = [
    { label: 'Available Balance', value: fmtMoney(balance), icon: Wallet, chip: 'chip-b' },
    { label: 'Total Deposited', value: fmtMoney(totalDeposited), icon: DollarSign, chip: 'chip-g' },
    { label: 'Pending Deposits', value: fmtMoney(pendingDeposits), icon: Clock, chip: 'chip-p' },
    { label: 'Last Deposit', value: last ? fmtMoney(last.amount) : '$0.00', icon: ArrowDownToLine, chip: 'chip-y' },
  ];

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="flex items-center text-xl font-bold hi"><Wallet size={24} className="mr-2 blut" /> Deposits</h1>
        <div className="hidden gap-2 md:flex">
          <Link href="/transactions" className="btn btn-ghost">Deposit History</Link>
          <a href="#form" className="btn btn-pri">New Deposit</a>
        </div>
      </div>

      {/* Balance cards */}
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

      {/* Methods table */}
      <div className="panel overflow-hidden">
        <div className="border-b p-5" style={{ borderColor: 'var(--soft)' }}>
          <h2 className="text-base font-bold hi">Select Deposit Method</h2>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4" style={{ borderColor: 'var(--soft)', background: 'var(--soft)' }}>
          <div className="flex items-center gap-2">
            <span className="btn btn-pri" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>Crypto</span>
            <span className="rounded-lg px-3 py-1.5 text-xs font-medium" style={{ background: 'var(--soft-2)', color: '#aab4c8' }}>Select a network</span>
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 faint" />
            <input placeholder="Search payment methods..." className="w-full rounded-lg border py-1.5 pl-9 pr-4 text-sm md:w-60" style={{ background: 'var(--field)', borderColor: 'var(--hairline-strong)', color: 'var(--text)' }} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>Method</th><th style={{ textAlign: 'right' }}>Limits</th><th style={{ textAlign: 'right' }}>Action</th></tr></thead>
            <tbody>
              {coins.map((m) => (
                <tr key={m.id} className="text-sm">
                  <td className="py-4">
                    <div className="flex items-center">
                      <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-lg p-1.5" style={{ background: 'var(--hairline)' }}>
                        <img src={m.icon} alt={m.name} className="h-full w-full object-contain" />
                      </div>
                      <div>
                        <p className="font-medium hi">{m.name}</p>
                        <p className="text-xs mut">{m.network}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 text-right"><div className="text-xs faint">Min: <span className="font-medium hi">$10.00</span></div></td>
                  <td className="py-4 text-right"><button className="btn btn-pri" style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem' }} onClick={() => setMethod(m.id)}>Deposit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form */}
      <div id="form" className="panel mt-6 overflow-hidden">
        <div className="border-b p-5" style={{ borderColor: 'var(--soft)' }}>
          <h2 className="flex items-center text-base font-bold hi"><PlusCircle size={20} className="mr-2 blut" /> Deposit Details</h2>
        </div>
        <form className="p-6" onSubmit={submitDeposit}>
          <div className="mb-4 flex items-center justify-between">
            <label className="text-sm font-medium hi">Amount to deposit</label>
            <span className="text-xs faint">Min: <span className="font-medium hi">$10.00</span></span>
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
            <label className="mb-1.5 block text-sm font-medium hi">Payment method</label>
            <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full rounded-xl border px-3 py-3 text-sm" style={{ background: 'var(--field)', borderColor: 'var(--hairline-strong)', color: 'var(--text)' }}>
              {coins.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.network})</option>)}
            </select>
          </div>

          {/* Admin-provided deposit address */}
          <div className="mb-4 rounded-xl border p-4" style={{ borderColor: 'var(--ok-bg)', background: 'var(--ok-bg)' }}>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium hi">Send {coin.symbol} to this address</span>
              <span className="pill pill-sec">{coin.network}</span>
            </div>
            <div className="flex items-center justify-between gap-2 rounded-xl border border-dashed px-3 py-2.5" style={{ borderColor: 'var(--hairline-strong)', background: 'var(--field)' }}>
              <span className="truncate font-mono text-xs hi">
                {coin.address || 'Awaiting deposit address from support'}
              </span>
              <button type="button" onClick={copyAddress} disabled={!coin.address} className="flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-medium disabled:opacity-50" style={{ background: 'var(--hairline)', color: 'var(--text)' }}>
                {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="mt-2 text-xs mut">Copy this address, send your {coin.name} from your wallet, then confirm below.</p>
          </div>

          {notice && (
            <p className={`mb-4 rounded-xl px-3 py-2 text-xs font-medium ${notice.kind === 'ok' ? 'bg-[var(--ok-bg)] text-[var(--ok-text)]' : 'bg-[var(--bad-bg)] text-[var(--bad-text)]'}`}>
              {notice.text}
            </p>
          )}

          <button type="submit" disabled={submitting} className="btn btn-pri flex w-full py-4 disabled:opacity-60">
            <ArrowDownToLine size={20} /> {submitting ? 'Submitting…' : "I've made the transfer"}
          </button>
          <p className="mt-3 text-center text-xs faint">Your deposit is credited to your balance once an admin approves it.</p>
        </form>
      </div>

      {/* Info cards */}
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="panel overflow-hidden">
          <div className="flex items-center border-b p-4" style={{ borderColor: 'var(--soft)' }}>
            <ListChecks size={20} className="mr-2 blut" /><h3 className="text-base font-medium hi">Deposit Process</h3>
          </div>
          <div className="p-5">
            <ol className="relative ml-3 space-y-6 border-l" style={{ borderColor: 'var(--hairline-strong)' }}>
              {['Select Method', 'Enter Amount', 'Send Crypto', 'Pending Approval'].map((s, i) => (
                <li key={s} className="ml-6">
                  <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full ring-4" style={{ background: 'rgba(10,84,255,.16)', color: '#8db2ff', '--tw-ring-color': '#0b0f1a' }}><span className="text-xs font-bold">{i + 1}</span></span>
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
            {['Always verify the address before sending.', 'Use secure and private connections.', 'Double-check the network type for crypto.', 'Never share your payment credentials.'].map((t) => (
              <div key={t} className="flex"><span className="chip chip-y mr-3 h-5 w-5 rounded-full"><Check size={12} /></span><p className="text-xs mut">{t}</p></div>
            ))}
          </div>
        </div>
        <div className="panel overflow-hidden">
          <div className="flex items-center border-b p-4" style={{ borderColor: 'var(--soft)' }}>
            <FileText size={20} className="mr-2 grn" /><h3 className="text-base font-medium hi">Deposit Policy</h3>
          </div>
          <div className="space-y-4 p-5">
            <Row k="Processing Time" v="After admin approval" />
            <Row k="Minimum Deposit" v="$10.00" />
            <Row k="Deposit Methods" v="Multiple" />
          </div>
        </div>
      </div>
    </>
  );
}

function Row({ k, v }) {
  return (
    <div className="flex items-center justify-between">
      <div><h4 className="text-sm font-medium hi">{k}</h4></div>
      <span className="text-xs font-medium hi">{v}</span>
    </div>
  );
}
