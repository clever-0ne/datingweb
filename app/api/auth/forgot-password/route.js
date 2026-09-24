import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { readDb, writeDb } from '@/lib/db';
import { sendPasswordResetEmail } from '@/lib/email-helpers';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email || '').trim().toLowerCase();

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const db = await readDb();
    const account = (db.accounts || []).find((a) => a.email === email);

    if (!account) {
      // Don't reveal if email exists for security
      return NextResponse.json({ ok: true, message: 'If an account exists, a reset link has been sent.' });
    }

    // Generate reset token (valid for 24 hours)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

    db.passwordResets = db.passwordResets || [];
    db.passwordResets.push({
      email,
      token: resetToken,
      expiresAt,
      createdAt: new Date().toISOString(),
    });

    await writeDb(db);

    // Send reset email (non-blocking - don't fail if email fails)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://podz.buzz';
    const resetLink = `${appUrl}/reset-password?token=${resetToken}`;

    try {
      await sendPasswordResetEmail(email, resetLink);
    } catch (error) {
      console.error('Password reset email error:', error);
    }

    return NextResponse.json({ ok: true, message: 'If an account exists, a reset link has been sent to the email address.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ ok: true, message: 'If an account exists, a reset link has been sent to the email address.' });
  }
}
