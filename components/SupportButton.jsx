'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageCircle } from 'lucide-react';

export const SUPPORT_SIZE = 56;
const KEY = 'support-pos';
const MARGIN = 12;
const TAP_SLOP = 6; // px of movement before a press counts as a drag

const clamp = (p) => ({
  x: Math.min(Math.max(MARGIN, p.x), window.innerWidth - SUPPORT_SIZE - MARGIN),
  y: Math.min(Math.max(MARGIN, p.y), window.innerHeight - SUPPORT_SIZE - MARGIN),
});

const defaultPos = () => ({
  x: window.innerWidth - SUPPORT_SIZE - 16,
  y: window.innerHeight - SUPPORT_SIZE - 24,
});

/** Tell InstallButton (and anything else) where the bubble is. */
const publish = (p) => {
  window.__supportPos = p;
  window.dispatchEvent(new CustomEvent('support-pos', { detail: p }));
};

/**
 * Draggable live-chat button. Smartsupp's own bubble lives in a cross-origin
 * iframe that cannot be dragged, so layout.jsx hides it (_smartsupp.hideWidget)
 * and this button opens the same chat with smartsupp('chat:open').
 * A tap opens the chat; a drag moves the button, and the spot is remembered on
 * this device. Hidden while the chat window is open (until messenger_close).
 */
export default function SupportButton() {
  const [pos, setPos] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const drag = useRef(null);

  useEffect(() => {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch {}
    const p = clamp(saved && Number.isFinite(saved.x) ? saved : defaultPos());
    setPos(p);
    publish(p);

    const onResize = () => setPos((cur) => { const n = clamp(cur || defaultPos()); publish(n); return n; });
    window.addEventListener('resize', onResize);

    // When the visitor closes the chat, Smartsupp shows its own bubble again
    // (chat:show was needed to open it) — hide it and bring this one back.
    // The loader is lazy, so wait for window.smartsupp before subscribing.
    const hook = () => {
      if (typeof window.smartsupp !== 'function') return false;
      window.smartsupp('on', 'messenger_close', () => {
        window.smartsupp('chat:hide');
        setChatOpen(false);
        window.dispatchEvent(new CustomEvent('support-chat', { detail: false }));
      });
      return true;
    };
    const poll = hook() ? null : setInterval(() => { if (hook()) clearInterval(poll); }, 500);

    return () => {
      window.removeEventListener('resize', onResize);
      if (poll) clearInterval(poll);
    };
  }, []);

  if (!pos || chatOpen) return null;

  const onDown = (e) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    drag.current = { sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y, moved: false };
  };

  const onMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.sx;
    const dy = e.clientY - d.sy;
    if (!d.moved && Math.hypot(dx, dy) < TAP_SLOP) return;
    d.moved = true;
    const n = clamp({ x: d.ox + dx, y: d.oy + dy });
    setPos(n);
    publish(n);
  };

  const onUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (d.moved) {
      try { localStorage.setItem(KEY, JSON.stringify(pos)); } catch {}
    } else if (typeof window.smartsupp === 'function') {
      // hideWidget keeps the widget unrendered until chat:show.
      window.smartsupp('chat:show');
      window.smartsupp('chat:open');
      setChatOpen(true);
        window.dispatchEvent(new CustomEvent('support-chat', { detail: true }));
    }
  };

  return (
    <button
      type="button"
      aria-label="Chat with support (drag to move)"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={() => { drag.current = null; }}
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        width: SUPPORT_SIZE,
        height: SUPPORT_SIZE,
        zIndex: 95,
        borderRadius: '50%',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#2f6dff',
        color: '#fff',
        boxShadow: '0 6px 20px rgba(47,109,255,.4)',
        cursor: 'grab',
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      <MessageCircle size={26} style={{ display: 'block' }} />
    </button>
  );
}
