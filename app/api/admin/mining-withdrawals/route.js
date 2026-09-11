import { NextResponse } from 'next/server';
import { readDb, isAuthed } from '@/lib/db';
import { buildAdminQueue, MINING_PAYOUTS } from '@/lib/payout';

// GET /api/admin/mining-withdrawals — the mining payout review queue.
export async function GET(req) {
  if (!(await isAuthed(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = await readDb();
  const miningWithdrawals = buildAdminQueue(db, MINING_PAYOUTS, {
    label: 'Mining',
    itemLabel: 'contracts',
  });

  return NextResponse.json({ miningWithdrawals });
}
