import { NextResponse } from 'next/server';
import { readDb, isAuthed } from '@/lib/db';
import { buildAdminQueue, INVESTMENT_PAYOUTS } from '@/lib/payout';

// GET /api/admin/investment-withdrawals — the investment payout review queue.
export async function GET(req) {
  if (!(await isAuthed(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = await readDb();
  const investmentWithdrawals = buildAdminQueue(db, INVESTMENT_PAYOUTS, {
    label: 'Investment',
    itemLabel: 'plans',
  });

  return NextResponse.json({ investmentWithdrawals });
}
