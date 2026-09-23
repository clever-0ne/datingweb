import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { pushNotification } from '@/lib/notifications';
import { deliverPush, deliverAdminPush } from '@/lib/push';
import { fmtUsd } from '@/lib/format';
import { send2FACodeEmail } from '@/lib/email-helpers';

const COINS = ['btc', 'eth', 'usdt', 'sol'];

// POST /api/deposits — create a pending deposit. The balance is NOT credited
// here; an admin must approve it from the console first.
export async function POST(req) {
  const session = await currentUser(req);
  if (!session?.profile) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const coin = String(body.coin || '').toLowerCase();
  const amount = Math.round(Number(body.amount) * 100) / 100;

  if (!COINS.includes(coin)) {
    return NextResponse.json({ error: 'Select a valid deposit method.' }, { status: 400 });
  }
  if (!(amount >= 10)) {
    return NextResponse.json({ error: 'Minimum deposit is $10.00.' }, { status: 400 });
  }

  const db = await readDb();
  db.deposits = db.deposits || [];
  const deposit = {
    id: `D-${Date.now()}`,
    userId: session.profile.id,
    user: session.profile.name,
    coin,
    amount,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  db.deposits.push(deposit);
  const notification = pushNotification(db, session.profile.id, {
    title: 'Deposit submitted',
    body: `Your ${coin.toUpperCase()} deposit of ${fmtUsd(amount)} is awaiting confirmation.`,
    kind: 'info',
  });
  await writeDb(db);
  await deliverPush(db, session.profile.id, notification);

  // A deposit sits in the console's queue until an admin approves it, so this
  // is the moment that queue grows — the push tells the admin to go look.
  await deliverAdminPush(db, {
    title: 'Deposit awaiting approval',
    body: `${session.profile.name} submitted a ${coin.toUpperCase()} deposit of ${fmtUsd(amount)}.`,
  });

  // Send deposit confirmation email
  try {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/email/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: session.profile.email,
        subject: 'Deposit Submitted',
        html: `
          <html>
            <body style="font-family: Arial, sans-serif;">
              <h1>Deposit Submitted ✅</h1>
              <p>Hi ${session.profile.name},</p>
              <p>We received your ${coin.toUpperCase()} deposit of <strong>$${amount.toFixed(2)}</strong></p>
              <p>Your deposit is now awaiting admin approval. You will receive an email notification once it's approved.</p>
              <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Status</a></p>
            </body>
          </html>
        `,
      }),
    });
  } catch (error) {
    console.error('Email send error:', error);
    // Don't fail the deposit if email fails
  }

  return NextResponse.json({ ok: true, deposit });
}
