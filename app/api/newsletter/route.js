import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/newsletter — footer sign-up. Stores the address in db.subscribers.
export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || '').trim().toLowerCase().slice(0, 200);
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });

  const db = await readDb();
  db.subscribers = Array.isArray(db.subscribers) ? db.subscribers : [];
  if (!db.subscribers.some((s) => s.email === email)) {
    db.subscribers.push({ email, createdAt: new Date().toISOString() });
    await writeDb(db);
  }
  return NextResponse.json({ ok: true });
}
