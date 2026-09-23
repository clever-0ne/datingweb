import { NextResponse } from 'next/server';
import { readDb, isAuthed } from '@/lib/db';
import { buildMining, buildInvestments } from '@/lib/account';

// GET /api/admin/plans — every user's mining contracts and investment plans,
// with the same live status and maturity date the user sees on their own
// dashboard. Built through the user-side projections so the two never disagree.
export async function GET(req) {
  if (!(await isAuthed(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const db = await readDb();

  const miningUsers = new Set((db.mining || []).map((m) => m.userId));
  const investUsers = new Set((db.investments || []).map((i) => i.userId));

  const mining = [...miningUsers].flatMap((uid) => buildMining(db, uid).map((m) => ({ ...m, userId: uid })));
  const investments = [...investUsers].flatMap((uid) =>
    buildInvestments(db, uid).map((i) => ({ ...i, userId: uid })),
  );

  return NextResponse.json({ mining, investments });
}
