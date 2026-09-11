import { NextResponse } from 'next/server';
import { isAuthed } from '@/lib/db';

export async function GET(req) {
  return NextResponse.json({ ok: await isAuthed(req) });
}
