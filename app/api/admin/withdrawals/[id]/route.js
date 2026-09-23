import { NextResponse } from 'next/server';
import { readDb, writeDb, isAuthed } from '@/lib/db';
import { pushNotification } from '@/lib/notifications';
import { deliverPush } from '@/lib/push';
import { fmtUsd, round2 } from '@/lib/format';
import { sendWithdrawalProcessedEmail } from '@/lib/email-helpers';

// PATCH /api/admin/withdrawals/:id — approve or reject a withdrawal.
// Approving debits the user's main balance; rejecting an approved withdrawal
// refunds it. Only an admin can move a withdrawal out of "pending".
export async function PATCH(req, { params }) {
  if (!(await isAuthed(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = await readDb();
  const withdrawal = (db.withdrawals || []).find((w) => w.id === params.id);
  if (!withdrawal) return NextResponse.json({ error: 'Withdrawal not found.' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const status = body.status;
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
  }
  if (withdrawal.status === status) return NextResponse.json({ ok: true, withdrawal });

  const user = (db.users || []).find((u) => u.id === withdrawal.userId);
  const amount = Number(withdrawal.amount) || 0;

  const wasApproved = withdrawal.status === 'approved';
  const nowApproved = status === 'approved';

  if (user) {
    if (!wasApproved && nowApproved) {
      if (Number(user.balance) < amount) {
        return NextResponse.json({ error: 'User has insufficient balance for this withdrawal.' }, { status: 400 });
      }
      user.balance = round2(Number(user.balance) - amount);
    } else if (wasApproved && !nowApproved) {
      user.balance = round2(Number(user.balance) + amount);
    }
  }

  withdrawal.status = status;

  // Exactly one of these fires — they are the three transitions that reach here.
  let notification = null;

  if (!wasApproved && nowApproved) {
    notification = pushNotification(db, withdrawal.userId, {
      title: 'Withdrawal approved',
      body: `Your ${String(withdrawal.coin || '').toUpperCase()} withdrawal of ${fmtUsd(amount)} is on its way.`,
      kind: 'success',
    });
  } else if (wasApproved && !nowApproved) {
    notification = pushNotification(db, withdrawal.userId, {
      title: 'Withdrawal reversed',
      body: `${fmtUsd(amount)} was returned to your balance.`,
      kind: 'error',
    });
  } else if (!nowApproved) {
    notification = pushNotification(db, withdrawal.userId, {
      title: 'Withdrawal rejected',
      body: `Your withdrawal of ${fmtUsd(amount)} was not approved. No funds were deducted.`,
      kind: 'error',
    });
  }

  await writeDb(db);
  // After the write, never before: a push about a decision that failed to save
  // would be a lie the user has no way to correct.
  if (notification) await deliverPush(db, withdrawal.userId, notification);

  // Send email notifications (non-blocking)
  try {
    if (!wasApproved && nowApproved) {
      const method = String(withdrawal.coin || '').toUpperCase();
      await sendWithdrawalProcessedEmail(user?.email, user?.name, amount, withdrawal.id, method);
    }
  } catch (error) {
    console.error('Email notification failed:', error);
  }

  return NextResponse.json({ ok: true, withdrawal });
}
