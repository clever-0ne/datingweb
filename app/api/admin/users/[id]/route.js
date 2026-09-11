import { NextResponse } from 'next/server';
import { readDb, writeDb, isAuthed } from '@/lib/db';

// PATCH /api/admin/users/:id — set balance or KYC status
export async function PATCH(req, { params }) {
  if (!(await isAuthed(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = await readDb();
  const user = (db.users || []).find((u) => u.id === params.id);
  if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

  const body = await req.json().catch(() => ({}));

  if (body.balance !== undefined) {
    const value = Number(body.balance);
    if (!Number.isFinite(value) || value < 0) {
      return NextResponse.json({ error: 'Balance must be a positive number.' }, { status: 400 });
    }
    user.balance = value;
  }

  if (body.kycStatus !== undefined) {
    const allowed = ['not_submitted', 'submitted', 'approved', 'rejected'];
    if (!allowed.includes(body.kycStatus)) {
      return NextResponse.json({ error: 'Invalid KYC status.' }, { status: 400 });
    }
    user.kycStatus = body.kycStatus;
  }

  await writeDb(db);
  return NextResponse.json({ ok: true, user });
}

// DELETE /api/admin/users/:id — removes the user and everything tied to them
export async function DELETE(req, { params }) {
  if (!(await isAuthed(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = await readDb();
  const exists = (db.users || []).some((u) => u.id === params.id);
  if (!exists) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

  db.users = db.users.filter((u) => u.id !== params.id);
  db.deposits = (db.deposits || []).filter((d) => d.userId !== params.id);
  db.withdrawals = (db.withdrawals || []).filter((w) => w.userId !== params.id);
  db.orders = (db.orders || []).filter((o) => o.userId !== params.id);

  await writeDb(db);
  return NextResponse.json({ ok: true });
}
