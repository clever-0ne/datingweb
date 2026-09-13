'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Registers the service worker and manages this device's push subscription.
 *
 * Push is a per-device choice, so `supported`/`subscribed` are device facts and
 * the toggle reflects them rather than a server-side setting. The subscription
 * is registered with the server only when the user opts in — never silently on
 * load, because prompting for notification permission unprompted is the fastest
 * way to get denied permanently.
 */

/** VAPID keys travel as base64url; the browser wants raw bytes. */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

/**
 * @param {object} [options]
 * @param {string} [options.subscribeUrl] where this device's subscription is
 *   registered. Defaults to the signed-in user's endpoint; the admin console
 *   passes its own, because it has a different session and a different
 *   audience (see app/api/admin/push/subscribe).
 */
export function usePush({ subscribeUrl = '/api/push/subscribe' } = {}) {
  const [supported, setSupported] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const ok =
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window;
    setSupported(ok);
    if (!ok) return;

    let alive = true;

    (async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js');
        const res = await fetch(subscribeUrl);
        const d = await res.json();
        if (!alive) return;
        setConfigured(!!d.configured);

        const existing = await reg.pushManager.getSubscription();
        if (alive) setSubscribed(!!existing && Notification.permission === 'granted');
      } catch {
        // A failed registration leaves push simply unavailable — the rest of
        // the app is unaffected.
      }
    })();

    return () => { alive = false; };
  }, [subscribeUrl]);

  const subscribe = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setError('Notifications are blocked for this site. Enable them in your browser settings.');
        return false;
      }

      const res = await fetch('/api/push/config');
      const { key } = await res.json().catch(() => ({}));
      if (!key) {
        setError('Push is not configured on the server.');
        return false;
      }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      });

      const saved = await fetch(subscribeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });
      if (!saved.ok) {
        setError('Could not save this device for notifications.');
        return false;
      }

      setSubscribed(true);
      return true;
    } catch {
      // Missing/invalid `key` in particular throws here rather than returning a
      // clean error, so surface one message the user can act on.
      setError('Could not enable notifications on this device.');
      return false;
    } finally {
      setBusy(false);
    }
  }, [subscribeUrl]);

  const unsubscribe = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        // Tell the server first: if the browser drops the subscription before
        // we report it, the row would linger and be pushed to until it 410s.
        await fetch(subscribeUrl, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
      return true;
    } catch {
      setError('Could not disable notifications.');
      return false;
    } finally {
      setBusy(false);
    }
  }, [subscribeUrl]);

  return { supported, configured, available: supported && configured, subscribed, busy, error, subscribe, unsubscribe };
}
