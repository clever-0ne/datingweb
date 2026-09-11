import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';

export async function GET(req) {
  const session = await currentUser(req);
  if (!session) return NextResponse.json({ user: null });

  const p = session.profile;
  return NextResponse.json({
    user: p
      ? { id: p.id, name: p.name, email: p.email, balance: p.balance, kycStatus: p.kycStatus }
      : { id: session.account.userId, name: session.account.name, email: session.account.email, balance: 0 },
  });
}
