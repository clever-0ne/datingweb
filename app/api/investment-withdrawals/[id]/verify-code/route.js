import { NextResponse } from 'next/server';
import { readDb, writeDb, isAuthed } from '@/lib/db';

export async function POST(req, { params }) {
  if (!(await isAuthed(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const code = String(body.code || '').trim();

  if (!code) {
    return NextResponse.json({ error: 'Verification code is required.' }, { status: 400 });
  }

  const db = await readDb();
  const payout = (db.investmentPayouts || []).find((p) => p.id === params.id);

  if (!payout) {
    return NextResponse.json({ error: 'Payout not found.' }, { status: 404 });
  }

  if (payout.status !== 'approved') {
    return NextResponse.json({ error: 'Payout is not approved.' }, { status: 400 });
  }

  // Find the withdrawal code
  const codeRecord = (db.withdrawalCodes || []).find(
    (c) => c.payoutId === params.id && c.type === 'investment' && !c.used
  );

  if (!codeRecord) {
    return NextResponse.json({ error: 'No valid code found for this payout.' }, { status: 400 });
  }

  if (codeRecord.code !== code) {
    return NextResponse.json({ error: 'Invalid code.' }, { status: 400 });
  }

  // Mark code as used
  codeRecord.used = true;
  codeRecord.usedAt = new Date().toISOString();

  // Mark payout as withdrawn
  payout.status = 'withdrawn';
  payout.withdrawnAt = new Date().toISOString();

  await writeDb(db);

  return NextResponse.json({ ok: true, message: 'Code verified. Payout released.' });
}
