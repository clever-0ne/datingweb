import { Resend } from 'resend';

/**
 * Single Resend client for every email the site sends.
 *
 * Uses the new account's key (RESEND_API_KEY_SECONDARY) and sends from its
 * verified domain (pudzz.buzz). The old RESEND_API_KEY is only used if the new
 * key isn't configured at all.
 *
 * Note: Resend does not throw when a send is rejected; it returns
 * `{ data: null, error }`. Callers must check `result.error`.
 */

const NEW_KEY = process.env.RESEND_API_KEY_SECONDARY;
const NEW_FROM = process.env.RESEND_FROM_EMAIL_SECONDARY || 'Tesla Capital <noreply@pudzz.buzz>';

const apiKey = NEW_KEY || process.env.RESEND_API_KEY;
const client = apiKey ? new Resend(apiKey) : null;

if (!NEW_KEY) {
  console.warn('[resend] RESEND_API_KEY_SECONDARY is not set; falling back to RESEND_API_KEY');
}

async function send(payload, options) {
  if (!client) {
    const error = { name: 'missing_api_key', message: 'No Resend API key configured.' };
    console.error('[resend]', error.message);
    return { data: null, error };
  }

  // The new account can only send from its own verified domain.
  const body = NEW_KEY ? { ...payload, from: NEW_FROM } : payload;

  try {
    const result = await client.emails.send(body, options);
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
