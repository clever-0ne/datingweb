'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, CheckCircle, Printer, FileText } from 'lucide-react';
import { fmtMoney } from '@/lib/wallet';

/**
 * A printable receipt for one order. Fetched by id from the server, which
 * scopes it to the signed-in owner — the order id is the only thing in the URL
 * and it is not enough on its own to read someone else's receipt.
 */
const fmtStamp = (iso) =>
  iso
    ? new Date(iso).toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : '';

function Line({ k, v, strong }) {
  return (
    <div className="flex justify-between py-1.5">
      <span className="mut">{k}</span>
      <span className={strong ? 'font-semibold text-white' : 'font-medium text-white'}>{v}</span>
    </div>
  );
}

export default function ReceiptPage() {
  const { id } = useParams();
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/receipts/${id}`);
      const d = await res.json();
      if (d.ok) setReceipt(d.receipt);
      else setError(d.error || 'Receipt not found.');
    } catch {
      setError('Could not load this receipt.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <div className="panel p-10 text-center text-sm mut">Loading receipt…</div>;
  }

  if (error || !receipt) {
    return (
      <div className="panel p-10 text-center">
        <FileText size={40} className="mx-auto mb-3 text-slate-500" />
        <h3 className="mb-1 text-lg font-semibold text-white">Receipt unavailable</h3>
        <p className="mb-5 text-sm mut">{error || 'Receipt not found.'}</p>
        <Link href="/transactions" className="btn btn-pri">Back to Transactions</Link>
      </div>
    );
  }

  return (
    <>
      <Link href="/transactions" className="mb-4 inline-flex items-center text-xs font-medium text-slate-400 hover:text-white">
        <ArrowLeft size={14} className="mr-1" /> Back to Transactions
      </Link>

      <div className="mx-auto max-w-2xl">
        <div className="panel p-6 sm:p-8">
          {/* Header */}
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b pb-5" style={{ borderColor: 'rgba(148,163,184,.12)' }}>
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-slate-400">{receipt.issuer}</p>
              <h1 className="text-2xl font-semibold text-white">Receipt</h1>
              <p className="mt-1 font-mono text-xs mut">{receipt.receiptId}</p>
            </div>
            <span className="pill pill-sec">
              <CheckCircle size={12} /> {receipt.status === 'completed' ? 'Paid' : receipt.status}
            </span>
          </div>

          {/* Parties */}
          <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Billed to</p>
              <p className="text-sm font-medium text-white">{receipt.customer.name}</p>
              <p className="text-xs mut">{receipt.customer.email}</p>
            </div>
            <div className="sm:text-right">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Issued</p>
              <p className="text-sm font-medium text-white">{fmtStamp(receipt.issuedAt)}</p>
              <p className="text-xs mut">Order {receipt.orderId}</p>
            </div>
          </div>

          {/* Line items */}
          <div className="mb-5 rounded-xl border p-4" style={{ borderColor: 'rgba(148,163,184,.12)', background: 'rgba(148,163,184,.03)' }}>
            <div className="flex justify-between border-b pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400" style={{ borderColor: 'rgba(148,163,184,.12)' }}>
              <span>Description</span>
              <span>Amount</span>
            </div>
            <div className="flex justify-between pt-3">
              <div className="min-w-0 pr-4">
                <p className="text-sm font-medium text-white">{receipt.item}</p>
                <p className="text-xs mut">{receipt.type}{receipt.ref ? ` · ${receipt.ref}` : ''}</p>
              </div>
              <p className="whitespace-nowrap text-sm font-semibold text-white">{fmtMoney(receipt.amount)}</p>
            </div>
          </div>

          {/* Totals */}
          <div className="mb-6 ml-auto max-w-xs text-sm">
            <Line k="Subtotal" v={fmtMoney(receipt.amount)} />
            <Line k="Payment method" v="Main balance" />
            <div className="mt-1 border-t pt-2" style={{ borderColor: 'rgba(148,163,184,.12)' }}>
              <Line k="Total paid" v={fmtMoney(receipt.amount)} strong />
            </div>
            <Line k="Balance after" v={fmtMoney(receipt.balanceAfter)} />
          </div>

          <p className="mb-6 text-center text-xs mut">
            Paid in full from your main balance. No further action is required.
          </p>

          <button type="button" onClick={() => window.print()} className="btn btn-pri w-full py-3">
            <Printer size={16} /> Print / Save as PDF
          </button>
        </div>
      </div>
    </>
  );
}
