import { Resend } from 'resend';

/**
 * Single Resend client for every email the site sends.
 * One key (RESEND_API_KEY) on the pudzz.buzz account, one sender.
 *
 * Note: Resend does not throw when a send is rejected; it returns
 * `{ data: null, error }`. Callers must check `result.error`.
 */

export const FROM_EMAIL = 'Tesla Capital <noreply@pudzz.buzz>';

// Strip whitespace/quotes that sneak in when pasting into the Vercel dashboard.
const apiKey = (process.env.RESEND_API_KEY || '').trim().replace(/^['"]|['"]$/g, '').trim();
const client = apiKey ? new Resend(apiKey) : null;

async function send(payload, options) {
  if (!client) {
    const error = { name: 'missing_api_key', message: 'RESEND_API_KEY is not set.' };
    console.error('[resend]', error.message);
    return { data: null, error };
  }

  try {
    const result = await client.emails.send({ ...payload, from: FROM_EMAIL }, options);
    if (result?.error) console.error('[resend] send rejected:', result.error);
    return result;
  } catch (err) {
    console.error('[resend] send threw:', err);
    return { data: null, error: { name: 'exception', message: err?.message || String(err) } };
  }
}

export const resend = {
  emails: { send },
};

export default resend;
