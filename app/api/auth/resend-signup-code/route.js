import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { SIGNUP_COOKIE, RESEND_COOLDOWN_MS, prunePending, issueSignupCode } from '@/lib/signup';

/** POST — email a fresh sign-up code for the pending sign-up in the cookie. */
export async function POST(req) {
  const id = req.cookies.get(SIGNUP_COOKIE)?.value;
  const db = await readDb();
  const p = id ? prunePending(db)[id] : null;
  if (!p) {
    return NextResponse.json({ error: 'This sign-up has expired. Please register again.', restart: true }, { status: 400 });
  }

  const wait = Math.ceil((p.sentAt + RESEND_COOLDOWN_MS - Date.now()) / 1000);
  if (wait > 0) {
    return NextResponse.json({ error: `Please wait ${wait}s before asking for another code.` }, { status: 429 });
  }

  const sent = await issueSignupCode(p);
  await writeDb(db);
  if (!sent) return NextResponse.json({ error: 'We could not send the email. Please try again.' }, { status: 502 });
  return NextResponse.json({ ok: true });
}
