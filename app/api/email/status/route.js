import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { FROM_EMAIL } from '@/lib/resend-client';

export const dynamic = 'force-dynamic';

// Email diagnostics: whether production has RESEND_API_KEY and whether Resend
// accepts it. Never returns the key value.
export async function GET() {
  const raw = process.env.RESEND_API_KEY || '';
  const key = raw.trim().replace(/^['"]|['"]$/g, '').trim();

  let resend = { ok: false, error: 'RESEND_API_KEY is not set' };
  if (key) {
    try {
      const { data, error } = await new Resend(key).domains.list();
      resend = error
        ? { ok: false, error: error.message }
        : { ok: true, domains: (data?.data || []).map((d) => `${d.name} (${d.status})`) };
    } catch (err) {
      resend = { ok: false, error: err?.message || String(err) };
    }
  }

  return NextResponse.json({
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || null,
    keySet: !!key,
    keyLooksValid: key.startsWith('re_'),
    from: FROM_EMAIL,
    resend,
  });
}
