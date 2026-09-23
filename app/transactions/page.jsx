'use client';

import Link from 'next/link';
import { useWallet, fmtMoney } from '@/lib/wallet';
import {
  Gift, TrendingUp, ArrowDown, ArrowUp, Briefcase, ShoppingBag, Receipt, Cpu, FileText,
} from 'lucide-react';

const ICONS = {
  gift: Gift,
  'trending-up': TrendingUp,
  'arrow-down': ArrowDown,
  'arrow-up': ArrowUp,
  briefcase: Briefcase,
  cpu: Cpu,
  'shopping-bag': ShoppingBag,
};

const KIND_CHIP = {
  credit: 'chip-g',
  debit: 'chip-r',
};

export default function TransactionsPage() {
  const { transactions } = useWallet();

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="flex items-center text-xl font-bold hi">
          <Receipt size={24} className="mr-2 blut" /> Transactions
        </h1>
        <span className="pill pill-gry">{transactions.length} records</span>
      </div>

      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th style={{ textAlign: 'right' }}>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => {
                const Icon = ICONS[t.icon] || Receipt;
                return (
                  <tr key={t.id}>
                    <td className="text-[11px] hi">{t.date}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className={`chip ${KIND_CHIP[t.kind]} h-8 w-8 rounded-full`}>
                          <Icon size={14} />
                        </span>
                        <div>
                          <p className="text-xs font-medium hi sm:text-sm">{t.type}</p>
                          <p className="text-xs mut">{t.sub}</p>
                        </div>
                      </div>
                    </td>
                    <td className={`whitespace-nowrap text-right text-xs font-semibold sm:text-sm ${t.kind === 'credit' ? 'grn' : 'redt'}`}>
                      {t.amount > 0 ? '+' : ''}{fmtMoney(t.amount)}
                    </td>
                    <td className="whitespace-nowrap text-right">
                      {t.receiptId ? (
                        <Link
                          href={`/receipt/${t.receiptId}`}
                          className="inline-flex items-center gap-1 text-xs font-medium blut"
                        >
                          <FileText size={13} /> View
                        </Link>
                      ) : (
                        <span className="text-xs faint">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
