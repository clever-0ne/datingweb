import { Resend } from 'resend';

/**
 * Resend client with a backup key. Tries RESEND_API_KEY first; if that send
 * throws or Resend returns an error (bad/revoked key, rate limit, quota), it
 * retries the same email with RESEND_API_KEY_SECONDARY.
 * Same interface as `new Resend(key)` for `.emails.send(...)`, so callers
 * don't change.
 */

const keys = [process.env.RESEND_API_KEY, process.env.RESEND_API_KEY_SECONDARY].filter(Boolean);
const clients = keys.map((k) => new Resend(k));

async function sendWithFallback(payload, options) {
  if (!clients.length) {
    return { data: null, error: { name: 'missing_api_key', message: 'No Resend API key configured.' } };
  }

  let last = null;
  for (let i = 0; i < clients.length; i++) {
    const label = i === 0 ? 'primary' : 'secondary';
    // The backup key lives on a different Resend account/domain, so it must
    // send from an address on that domain or Resend rejects it.
    const body = i > 0 && process.env.RESEND_FROM_EMAIL_SECONDARY
      ? { ...payload, from: process.env.RESEND_FROM_EMAIL_SECONDARY }
      : payload;
    try {
      const result = await clients[i].emails.send(body, options);
      if (!result?.error) {
        if (i > 0) console.warn(`[resend] sent with ${label} key after primary failed`);
        return result;
      }
      console.error(`[resend] ${label} key failed:`, result.error);
      last = result;
    } catch (err) {
      console.error(`[resend] ${label} key threw:`, err);
      last = { data: null, error: { name: 'exception', message: err?.message || String(err) } };
    }
  }
  return last;
}

export const resend = {
  emails: { send: sendWithFallback },
};

export default resend;
