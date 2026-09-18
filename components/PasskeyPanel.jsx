'use client';

import { useEffect, useState } from 'react';
import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn,
} from '@simplewebauthn/browser';
import { Fingerprint, Plus, Trash2 } from 'lucide-react';

/**
 * Passkey UI — the two halves of WebAuthn that run in the browser.
 *
 * `@simplewebauthn/browser` owns the platform call. It converts the challenge
 * and credential ids between the base64url strings the server sends and the
 * ArrayBuffers the WebAuthn API requires, and normalises the errors — doing
 * that by hand is where the fiddly bugs live, since `navigator.credentials`
 * speaks an entirely different dialect to JSON.
 *
 * The two halves are styled for where they mount: `PasskeySignIn` for the light
 * auth card on /login, `PasskeyManager` for the dark app on /account. Both read
 * their colours from the surrounding page, so re-theming the site does not
 * reach in here — except the sign-in button's own border, which is Tailwind.
 *
 * Neither half renders on a browser without WebAuthn — `browserSupportsWebAuthn`
 * is checked after mount (it touches `window`) and both return null. A sign-in
 * page with a dead button is worse than a sign-in page with one fewer option.
 */

/** The user dismissing the fingerprint or Face ID prompt is not a failure, and
 *  reporting it as one trains people to distrust the button. Everything else is
 *  worth saying out loud. */
function isCancel(err) {
  return err && (err.name === 'NotAllowedError' || err.name === 'AbortError');
}

function message(err, fallback) {
  if (isCancel(err)) return '';
  if (err && err.name === 'InvalidStateError') {
    return 'This device already has a passkey for your account.';
  }
  if (err && err.name === 'NotSupportedError') {
    return 'This browser cannot use passkeys.';
  }
  return fallback;
}

const post = (url, body) =>
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
  });

/* ------------------------------------------------------------------ sign in */

/**
 * "Sign in with a passkey" for /login. No email is asked for — the browser
 * offers whichever passkeys it holds for this site, and the server works out
 * the account from the one that is chosen.
 */
export function PasskeySignIn() {
  const [supported, setSupported] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  // Resolved after mount: the check touches `window`, which does not exist
  // during the server render.
  useEffect(() => setSupported(browserSupportsWebAuthn()), []);

  if (!supported) return null;

  const go = async () => {
    setErr('');
    setBusy(true);
    try {
      const optionsRes = await post('/api/auth/passkey/login/options');
      const options = await optionsRes.json();
      if (!optionsRes.ok) throw new Error(options.error || 'Unable to start.');

      const response = await startAuthentication({ optionsJSON: options });

      const verifyRes = await post('/api/auth/passkey/login/verify', { response });
      const data = await verifyRes.json();
      if (data.ok) {
        window.location.href = '/dashboard';
        return;
      }
      setErr(data.error || 'That passkey was not recognised.');
    } catch (e) {
      setErr(message(e, 'That passkey could not be used. Please try again.'));
    }
    setBusy(false);
  };

  return (
    <>
      {/* A rule with the word in it, rather than a bare "or" line: it reads as
          a fork in the form, which is what it is. */}
      <div className="my-5 flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-black/10" />
        <span className="text-xs font-medium mut">or</span>
        <span className="h-px flex-1 bg-black/10" />
      </div>

      {err && (
        <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-700">
          {err}
        </div>
      )}

      <button
        type="button"
        onClick={go}
        disabled={busy}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-black/15 bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-black/[0.04] focus:outline-none focus:ring-2 focus:ring-black/20 focus:ring-offset-2 focus:ring-offset-white disabled:opacity-60"
      >
        <Fingerprint size={17} />
        {busy ? 'Waiting for your device…' : 'Sign in with a passkey'}
      </button>
    </>
  );
}

/* ------------------------------------------------------------------- manage */

/**
 * Add, list and remove passkeys, for /account.
 *
 * Adding requires an existing session, which is the point: a passkey is a
 * second way into an account that already exists, never a way to create one.
 */
export function PasskeyManager() {
  const [supported, setSupported] = useState(false);
  const [keys, setKeys] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [note, setNote] = useState('');

  const load = async () => {
    try {
      const r = await fetch('/api/auth/passkey');
      const d = await r.json();
      setKeys(d.ok ? d.passkeys : []);
    } catch {
      setKeys([]);
    }
  };

  useEffect(() => {
    const ok = browserSupportsWebAuthn();
    setSupported(ok);
    if (ok) load();
  }, []);

  if (!supported) return null;

  const add = async () => {
    setErr('');
    setNote('');
    setBusy(true);
    try {
      const optionsRes = await post('/api/auth/passkey/register/options');
      const options = await optionsRes.json();
      if (!optionsRes.ok) throw new Error(options.error || 'Unable to start.');

      const response = await startRegistration({ optionsJSON: options });

      const verifyRes = await post('/api/auth/passkey/register/verify', { response });
      const data = await verifyRes.json();
      if (!data.ok) {
        setErr(data.error || 'That passkey could not be saved.');
      } else {
        setNote(`${data.passkey.name} added.`);
        await load();
      }
    } catch (e) {
      setErr(message(e, 'That passkey could not be added. Please try again.'));
    }
    setBusy(false);
  };

  const remove = async (id) => {
    setErr('');
    setNote('');
    try {
      const r = await fetch(`/api/auth/passkey/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        setErr(d.error || 'That passkey could not be removed.');
        return;
      }
      await load();
    } catch {
      setErr('Network error. Please try again.');
    }
  };

  return (
    <div>
      {keys && keys.length > 0 && (
        <ul className="mb-4 space-y-2">
          {keys.map((k) => (
            <li
              key={k.id}
              className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5"
              style={{ borderColor: 'var(--border)', background: 'var(--panel-2)' }}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium" style={{ color: 'var(--text)' }}>
                  {k.name}
                </p>
                <p className="text-xs" style={{ color: 'var(--faint)' }}>
                  Added {new Date(k.createdAt).toLocaleDateString()}
                  {k.lastUsedAt ? ` · last used ${new Date(k.lastUsedAt).toLocaleDateString()}` : ' · not used yet'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => remove(k.id)}
                aria-label={`Remove ${k.name}`}
                className="shrink-0 rounded-lg p-2 transition hover:bg-white/5"
                style={{ color: 'var(--danger)' }}
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {keys && keys.length === 0 && (
        <p className="mb-4 text-sm" style={{ color: 'var(--muted)' }}>
          No passkeys yet. Add one to sign in with your fingerprint, face or screen lock
          instead of a password.
        </p>
      )}

      {err && (
        <p className="mb-3 text-sm" style={{ color: 'var(--danger)' }}>
          {err}
        </p>
      )}
      {note && (
        <p className="mb-3 text-sm" style={{ color: 'var(--green)' }}>
          {note}
        </p>
      )}

      <button
        type="button"
        onClick={add}
        disabled={busy}
        className="btn btn-pri inline-flex items-center gap-2 disabled:opacity-60"
      >
        {keys && keys.length ? <Plus size={16} /> : <Fingerprint size={16} />}
        {busy ? 'Waiting for your device…' : 'Add a passkey'}
      </button>
    </div>
  );
}
