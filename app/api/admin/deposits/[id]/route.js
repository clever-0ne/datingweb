import { NextResponse } from 'next/server';
import { readDb, writeDb, isAuthed } from '@/lib/db';
import { pushNotification } from '@/lib/notifications';
import { deliverPush } from '@/lib/push';
import { fmtUsd, round2 } from '@/lib/format';
import { sendDepositApprovedEmail, sendDepositRejectedEmail } from '@/lib/email-helpers';

// PATCH /api/admin/deposits/:id — approve or reject a deposit.
// Approving credits the amount to the user's main balance; moving a deposit
// back off "approved" reverses that credit.
export async function PATCH(req, { params }) {
  if (!(await isAuthed(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = await readDb();
  const deposit = (db.deposits || []).find((d) => d.id === params.id);
  if (!deposit) return NextResponse.json({ error: 'Deposit not found.' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const status = body.status;
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
  }
  if (deposit.status === status) return NextResponse.json({ ok: true, deposit });

  const user = (db.users || []).find((u) => u.id === deposit.userId);
  const amount = Number(deposit.amount) || 0;

  const wasApproved = deposit.status === 'approved';
  const nowApproved = status === 'approved';

  if (user) {
    if (!wasApproved && nowApproved) user.balance = round2(Number(user.balance) + amount);
    else if (wasApproved && !nowApproved) user.balance = Math.max(0, round2(Number(user.balance) - amount));
  }

  deposit.status = status;

  // Tell the user what happened. Only on a real transition — re-saving the same
  // status returns early above, so this cannot fire twice for one decision.
  // Exactly one of these fires — they are the three transitions that reach here.
  let notification = null;

  if (!wasApproved && nowApproved) {
    notification = pushNotification(db, deposit.userId, {
      title: 'Deposit confirmed',
      body: `${fmtUsd(amount)} has been credited to your balance.`,
      kind: 'success',
    });
  } else if (wasApproved && !nowApproved) {
    notification = pushNotification(db, deposit.userId, {
      title: 'Deposit reversed',
      body: `The ${fmtUsd(amount)} credit on your account was reversed.`,
      kind: 'error',
    });
  } else if (!nowApproved) {
    notification = pushNotification(db, deposit.userId, {
      title: 'Deposit rejected',
      body: `Your ${String(deposit.coin || '').toUpperCase()} deposit of ${fmtUsd(amount)} was not approved.`,
      kind: 'error',
    });
  }

  await writeDb(db);
  // After the write, never before: a push about a credit that failed to save
  // would be a lie the user has no way to correct.
  if (notification) await deliverPush(db, deposit.userId, notification);

  // Send email notifications (non-blocking)
  try {
    if (!wasApproved && nowApproved) {
      await sendDepositApprovedEmail(user?.email, user?.name, amount, deposit.id);
    } else if (!nowApproved && (wasApproved || status === 'rejected')) {
      await sendDepositRejectedEmail(user?.email, user?.name, amount, 'Admin decision');
    }
  } catch (error) {
    console.error('Email notification failed:', error);
  }

  return NextResponse.json({ ok: true, deposit });
}
