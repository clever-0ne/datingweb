'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Download, Share, PlusSquare, MoreVertical, X } from 'lucide-react';
import { SUPPORT_SIZE } from '@/components/SupportButton';

const PAGES = ['/', '/login'];

/**
 * Floating "Install app" button on the landing and login pages.
 *
 * Android / desktop Chrome: fires the browser's own install prompt, captured
 * early by the inline script in app/layout.jsx (it can fire before React
 * mounts) and kept on window.__installPrompt.
 * iOS: no browser lets a page install itself, so the button opens the
 * Share → Add to Home Screen steps instead.
 * Hidden when already running as the installed app.
 */
export default function InstallButton() {
  const pathname = usePathname();
  const [platform, setPlatform] = useState(null); // 'prompt' | 'ios' | 'android' | null
  const [open, setOpen] = useState(false);
  // Where the draggable support bubble is; the pill sits just above it.
  const [anchor, setAnchor] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    const sync = () => setAnchor(window.__supportPos ? { ...window.__supportPos, vw: window.innerWidth, vh: window.innerHeight } : null);
    sync();
    window.addEventListener('support-pos', sync);
    const onChat = (e) => setChatOpen(!!e.detail);
    window.addEventListener('support-chat', onChat);
    window.addEventListener('resize', sync);
    return () => {
      window.removeEventListener('support-pos', sync);
      window.removeEventListener('support-chat', onChat);
      window.removeEventListener('resize', sync);
    };
  }, []);

  useEffect(() => {
    const standalone =
      window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
    if (standalone) return;

    // Android Chrome only offers the install prompt once a service worker is
    // registered. sw.js is the same worker push notifications use.
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});

    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const android = /Android/i.test(ua);

    const pick = () => setPlatform(window.__installPrompt ? 'prompt' : ios ? 'ios' : android ? 'android' : null);
    pick();
    const onInstalled = () => setPlatform(null);
    window.addEventListener('installpromptready', pick);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('installpromptready', pick);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (!platform || chatOpen || !PAGES.includes(pathname)) return null;

  const install = async () => {
    const prompt = window.__installPrompt;
    if (!prompt) return setOpen(true);
    prompt.prompt();
    const { outcome } = await prompt.userChoice.catch(() => ({}));
    window.__installPrompt = null; // a prompt can only be used once
    setPlatform(outcome === 'accepted' ? null : /Android/i.test(navigator.userAgent) ? 'android' : null);
  };

  // Above the support bubble, aligned to whichever side of the screen it is on.
  const place = anchor
    ? {
        bottom: anchor.vh - anchor.y + 10,
        ...(anchor.x + SUPPORT_SIZE / 2 > anchor.vw / 2
          ? { right: anchor.vw - (anchor.x + SUPPORT_SIZE) }
          : { left: anchor.x }),
      }
    : { right: 16, bottom: 'calc(24px + env(safe-area-inset-bottom, 0px))' };

  return (
    <>
      <button
        type="button"
        onClick={platform === 'prompt' ? install : () => setOpen(true)}
        style={{
          position: 'fixed',
          ...place,
          zIndex: 90,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 18px',
          borderRadius: 999,
          border: 'none',
          background: '#e82127',
          color: '#fff',
          fontSize: 14,
          fontWeight: 600,
          boxShadow: '0 6px 20px rgba(232,33,39,.35)',
          cursor: 'pointer',
        }}
      >
        <Download size={18} /> Install app
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Install the app"
          onClick={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 120, background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 440,
              background: '#fff',
              color: '#111',
              borderRadius: '20px 20px 0 0',
              padding: '22px 22px calc(26px + env(safe-area-inset-bottom, 0px))',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <strong style={{ fontSize: 18 }}>Install Tesla Capital</strong>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" style={{ border: 'none', background: 'none', padding: 4, cursor: 'pointer', color: '#555' }}>
                <X size={20} />
              </button>
            </div>
            {platform === 'ios' ? (
              <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 1.9, fontSize: 15 }}>
                <li>
                  Tap the <Share size={16} style={{ display: 'inline-block', verticalAlign: '-3px' }} /> <b>Share</b> button in your browser bar.
                </li>
                <li>
                  Scroll down and tap <PlusSquare size={16} style={{ display: 'inline-block', verticalAlign: '-3px' }} /> <b>Add to Home Screen</b>.
                </li>
                <li>Tap <b>Add</b>. The app appears on your home screen.</li>
              </ol>
            ) : (
              <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 1.9, fontSize: 15 }}>
                <li>
                  Tap the <MoreVertical size={16} style={{ display: 'inline-block', verticalAlign: '-3px' }} /> <b>menu</b> button in your browser.
                </li>
                <li>Tap <b>Install app</b> or <b>Add to Home screen</b>.</li>
                <li>Tap <b>Install</b> to confirm.</li>
              </ol>
            )}
            <p style={{ marginTop: 14, fontSize: 13, color: '#666' }}>
              Installing also lets you get notifications for payout codes and account activity.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
