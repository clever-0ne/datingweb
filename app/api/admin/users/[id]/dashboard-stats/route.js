import { NextResponse } from 'next/server';
import { readDb, writeDb, isAuthed } from '@/lib/db';

// POST /api/admin/users/:id/dashboard-stats — set the per-user dashboard figures
export async function POST(req, { params }) {
  if (!(await isAuthed(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = await readDb();
  const user = (db.users || []).find((u) => u.id === params.id);
  if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const totalProfit = Number(body.totalProfit);
  const bonus = Number(body.bonus);

  if (!Number.isFinite(totalProfit) || !Number.isFinite(bonus)) {
    return NextResponse.json({ error: 'Stats must be numbers.' }, { status: 400 });
  }

  user.dashboardStats = { totalProfit, bonus };

  await writeDb(db);
  return NextResponse.json({ ok: true, user });
}
