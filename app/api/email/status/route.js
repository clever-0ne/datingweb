import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

// Email diagnostics: which Resend variables production can see and whether
// Resend accepts the key. Never returns key values.
export async function GET() {
  const secondary = process.env.RESEND_API_KEY_SECONDARY || '';
  const primary = process.env.RESEND_API_KEY || '';
  const key = secondary || primary;

  const describe = (k) => ({
    set: !!k,
    length: k.length,
    startsWithRe: k.startsWith('re_'),
    hasWhitespaceOrQuotes: /[\s"']/.test(k),
  });

  let resend = { ok: false, error: 'no key' };
  if (key) {
    try {
      const { data, error } = await new Resend(key.trim()).domains.list();
      resend = error
        ? { ok: false, error: error.message }
        : { ok: true, domains: (data?.data || []).map((d) => `${d.name} (${d.status})`) };
    } catch (err) {
      resend = { ok: false, error: err?.message || String(err) };
    }
  }

  return NextResponse.json({
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || null,
    using: secondary ? 'RESEND_API_KEY_SECONDARY' : primary ? 'RESEND_API_KEY' : 'none',
    RESEND_API_KEY_SECONDARY: describe(secondary),
    RESEND_API_KEY: describe(primary),
    RESEND_FROM_EMAIL_SECONDARY: process.env.RESEND_FROM_EMAIL_SECONDARY || null,
    resend,
  });
}
