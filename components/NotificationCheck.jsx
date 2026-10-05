'use client';

import { useEffect, useRef, useState } from 'react';
import { BellRing, X } from 'lucide-react';
import { usePush } from '@/lib/usePush';

const DISMISS_KEY = 'notif-check-dismissed';
const DISMISS_MS = 3 * 24 * 60 * 60 * 1000; // ask again after 3 days

const readDismissed = () => {
  try { return Date.now() - Number(localStorage.getItem(DISMISS_KEY) || 0) < DISMISS_MS; } catch { return false; }
};

/**
 * Checks whether this device can receive notifications and nudges the user
 * when it can't. Signed-in pages only (rendered by AppChrome).
 *
 *   permission granted, device not registered  → re-register silently
 *   permission not asked yet                    → banner with "Enable"
 *   permission blocked                          → how to unblock it
 *   iPhone/iPad in a browser tab                → install the app first
 *                                                 (iOS only allows push there)
 */
export default function NotificationCheck() {
  const push = usePush();
  const [state, setState] = useState(null); // 'ask' | 'blocked' | 'install-ios' | null
  const [hidden, setHidden] = useState(true);
  const autoTried = useRef(false);

  useEffect(() => {
    setHidden(readDismissed());

    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const standalone =
      window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;

    if (!('Notification' in window) || !push.supported) {
      setState(ios && !standalone ? 'install-ios' : null);
      return;
    }
    if (!push.configured || push.subscribed) {
      setState(null);
      return;
    }

    const perm = Notification.permission;
    if (perm === 'granted') {
      // Allowed before but this device has no live subscription (cleared,
      // expired, or never saved): fix it without bothering the user.
      setState(null);
      if (!autoTried.current) {
        autoTried.current = true;
        push.subscribe();
      }
    } else {
      setState(perm === 'denied' ? 'blocked' : 'ask');
    }
    // push.busy: re-check once a permission request settles, so a "Block"
    // answer turns the banner into the how-to-unblock message.
  }, [push.supported, push.configured, push.subscribed, push.busy]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!state || hidden) return null;

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
    setHidden(true);
  };

  const text = {
    ask: 'Turn on notifications so you never miss a payout code or account update.',
    blocked: 'Notifications are blocked for this site. Allow them in your browser or phone settings (Site settings → Notifications) to get payout codes and account updates.',
    'install-ios': 'To get notifications on iPhone, install the app first: tap Share, then Add to Home Screen, and open it from your home screen.',
  }[state];

  return (
    <div className="panel mb-4 flex items-start gap-3 p-4" role="status">
      <BellRing size={20} className="mt-0.5 shrink-0" style={{ color: 'var(--secondary)' }} />
      <div className="min-w-0 flex-1">
        <p className="text-sm hi">{text}</p>
        {push.error && state === 'ask' && <p className="mt-1 text-xs text-red-500">{push.error}</p>}
        {state === 'ask' && (
          <button type="button" onClick={push.subscribe} disabled={push.busy} className="btn btn-pri mt-3 disabled:opacity-60" style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}>
            {push.busy ? 'Enabling…' : 'Enable notifications'}
          </button>
        )}
      </div>
      <button type="button" onClick={dismiss} aria-label="Dismiss" className="mut hover-tx shrink-0">
        <X size={18} />
      </button>
    </div>
  );
}
