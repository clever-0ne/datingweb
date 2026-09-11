import { NextResponse } from 'next/server';
import { readDb, isAuthed } from '@/lib/db';

export async function GET(req) {
  if (!(await isAuthed(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const db = await readDb();
  return NextResponse.json({ users: db.users || [] });
}
