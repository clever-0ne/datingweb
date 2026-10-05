import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { issueOtp, cooldownLeft } from '@/lib/withdraw-otp';
import { send2FACodeEmail } from '@/lib/email-helpers';

// POST /api/withdrawals/otp — email the signed-in user a withdrawal code.
export async function POST(req) {
  const session = await currentUser(req);
  if (!session?.profile) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

  const db = await readDb();
  const wait = cooldownLeft(db, session.profile.id);
  if (wait > 0) {
    return NextResponse.json({ error: `Please wait ${wait}s before asking for another code.` }, { status: 429 });
  }

  const code = issueOtp(db, session.profile.id);
  const sent = await send2FACodeEmail(session.account.email, code, 'withdrawal');
  if (sent?.success === false) {
    return NextResponse.json({ error: 'We could not send the email. Please try again.' }, { status: 502 });
  }
  await writeDb(db);
  return NextResponse.json({ ok: true });
}
