import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { readDb, writeDb } from '@/lib/db';
import { hashPassword, createSession, USER_COOKIE } from '@/lib/auth';
import { pushNotification } from '@/lib/notifications';
import { deliverPush, deliverAdminPush } from '@/lib/push';
import { REFERRAL_BONUS } from '@/lib/plans';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const phone = String(body.phone || '').trim();
  const address = String(body.address || '').trim();

  if (!name) return NextResponse.json({ error: 'Please enter your name.' }, { status: 400 });
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
  }
  if (!phone) return NextResponse.json({ error: 'Please enter your phone number.' }, { status: 400 });
  if (!address) return NextResponse.json({ error: 'Please enter your address.' }, { status: 400 });

  const db = await readDb();
  db.accounts = db.accounts || [];
  db.users = db.users || [];

  const ref = String(body.ref || '').trim();
  const referrer = ref ? (db.users || []).find((u) => u.id === ref) : null;

  if (db.accounts.some((a) => a.email === email)) {
    return NextResponse.json({ error: 'An account with that email already exists.' }, { status: 409 });
  }

  const userId = `TC-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  const { salt, hash } = hashPassword(password);

  db.users.push({
    id: userId,
    name,
    email,
    phone,
    address,
    role: 'user',
    balance: 0,
    profileImage: null,
    kycStatus: 'not_submitted',
    kycData: {},
    idImages: [],
    blocked: false,
    createdAt: new Date().toISOString(),
    dashboardStats: { totalProfit: 0, bonus: 0 },
    referredBy: referrer ? referrer.id : null,
  });

  const account = { id: `ACC-${crypto.randomBytes(4).toString('hex').toUpperCase()}`, userId, name, email, salt, hash, createdAt: new Date().toISOString() };
  db.accounts.push(account);

  if (referrer) {
    referrer.balance = Math.round((Number(referrer.balance || 0) + REFERRAL_BONUS) * 100) / 100;
    pushNotification(db, referrer.id, {
      title: 'Referral bonus',
      body: `${name} signed up with your link — $${REFERRAL_BONUS} added to your balance.`,
      kind: 'success',
    });
  }

  const token = createSession(db, account.id);
  const notification = pushNotification(db, userId, {
    title: 'Welcome to Tesla Capital',
    body: `Your account ${userId} is ready. Fund it to start investing.`,
    kind: 'success',
  });
  await writeDb(db);
  await deliverPush(db, userId, notification);

  // Alert the console that there is a new account. After the write, like every
  // other push: the user is registered whether or not this lands, and a push
  // failure must not fail their signup.
  await deliverAdminPush(db, {
    title: 'New user registered',
    body: `${name} (${email}) just created an account.`,
  });

  const res = NextResponse.json({
    ok: true,
    user: { id: userId, name, email, balance: 0, kycStatus: 'not_submitted' },
  });
  res.cookies.set(USER_COOKIE, token, { httpOnly: true, sameSite: 'lax', path: '/' });
  return res;
}
