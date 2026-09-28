'use client';

import { useEffect, useState } from 'react';

/**
 * Visitor locale: detects country from IP, then
 *  - converts every fmtMoney() amount from USD into the local currency
 *  - auto-translates the whole site into the local language (Google Translate)
 * Stored amounts stay in USD; only the display changes.
 */

const CACHE_KEY = 'locale.v1';
const CACHE_TTL = 12 * 60 * 60 * 1000; // refresh rates twice a day

// Module-level so fmtMoney (a plain function) can read it anywhere.
let current = { currency: 'USD', rate: 1, locale: 'en-US', lang: 'en' };

export function getLocale() {
  return current;
}

export function formatMoney(usd) {
  const { currency, rate, locale } = current;
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(usd || 0) * rate);
  } catch {
    return '$' + Number(usd || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}

function readCache() {
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    return c && Date.now() - c.at < CACHE_TTL ? c : null;
  } catch {
    return null;
  }
}

function writeCache(data) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ...data, at: Date.now() })); } catch {}
}

// Google Translate wants a few languages in region form.
function toGoogleLang(code) {
  const c = String(code || 'en').toLowerCase();
  if (c === 'zh' || c === 'zh-cn' || c === 'zh-sg') return 'zh-CN';
  if (c === 'zh-tw' || c === 'zh-hk') return 'zh-TW';
  if (c === 'he') return 'iw';
  return c.split('-')[0];
}

async function detect() {
  const nav = typeof navigator !== 'undefined' ? navigator.language || 'en-US' : 'en-US';
  let currency = 'USD';
  let lang = nav;
  let country = '';
  try {
    const geo = await fetch('https://ipapi.co/json/').then((r) => r.json());
    if (geo?.currency) currency = geo.currency;
    if (geo?.languages) lang = geo.languages.split(',')[0];
    country = geo?.country_code || '';
  } catch {}

  let rate = 1;
  if (currency !== 'USD') {
    try {
      const fx = await fetch('https://open.er-api.com/v6/latest/USD').then((r) => r.json());
      rate = fx?.rates?.[currency];
      if (!rate) { currency = 'USD'; rate = 1; }
    } catch {
      currency = 'USD';
      rate = 1;
    }
  }

  // Format numbers the way that country does (e.g. de-DE: 1.234,56 €).
  const base = String(lang).split('-')[0];
  const locale = country ? `${base}-${country}` : nav;
  return { currency, rate, locale, lang: toGoogleLang(lang) };
}

function enableTranslate(lang) {
  if (!lang || lang === 'en') {
    document.cookie = 'googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    return;
  }
  const value = `/en/${lang}`;
  document.cookie = `googtrans=${value}; path=/`;
  document.cookie = `googtrans=${value}; path=/; domain=${location.hostname}`;
  if (document.getElementById('gt-script')) return;

  // Google Translate rewrites text nodes, which makes React's removeChild /
  // insertBefore throw on re-render. Make those calls tolerant.
  const rc = Node.prototype.removeChild;
  Node.prototype.removeChild = function (child) {
    if (child.parentNode !== this) return child;
    return rc.call(this, child);
  };
  const ib = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function (node, ref) {
    if (ref && ref.parentNode !== this) return node;
    return ib.call(this, node, ref);
  };

  const holder = document.createElement('div');
  holder.id = 'google_translate_element';
  holder.style.display = 'none';
  document.body.appendChild(holder);
  window.googleTranslateElementInit = () => {
    new window.google.translate.TranslateElement({ pageLanguage: 'en', autoDisplay: false }, 'google_translate_element');
  };
  const s = document.createElement('script');
  s.id = 'gt-script';
  s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
  s.async = true;
  document.body.appendChild(s);
}

export function LocaleProvider({ children }) {
  // Server + first client render use USD so hydration matches; the key change
  // after detection remounts the tree once so every amount re-renders.
  const [key, setKey] = useState('USD');

  useEffect(() => {
    let alive = true;
    const apply = (data) => {
      current = { currency: data.currency, rate: data.rate, locale: data.locale, lang: data.lang };
      document.documentElement.lang = data.lang;
      enableTranslate(data.lang);
      if (alive) setKey(`${data.currency}:${data.rate}`);
    };
    const cached = readCache();
    if (cached) apply(cached);
    else detect().then((d) => { writeCache(d); apply(d); });
    return () => { alive = false; };
  }, []);

  return <div key={key} style={{ display: 'contents' }}>{children}</div>;
}

// ---- Amount inputs: users type local currency, the app stores USD ----

const round2 = (n) => Math.round(n * 100) / 100;

/** Local-currency amount the user typed -> USD for saving. */
export function toUSD(local) {
  return round2(Number(local || 0) / current.rate);
}

/** USD -> local-currency number for pre-filling an input. */
export function fromUSD(usd) {
  return round2(Number(usd || 0) * current.rate);
}

/** Smallest local amount that still converts to at least `usd` (so the min shown is always accepted). */
export function minLocal(usd) {
  return Math.ceil(usd * current.rate * 100) / 100;
}

/** Symbol for the visitor's currency, e.g. "€", "£", "CHF". */
export function currencySymbol() {
  try {
    const parts = new Intl.NumberFormat(current.locale, { style: 'currency', currency: current.currency }).formatToParts(0);
    return parts.find((p) => p.type === 'currency')?.value || current.currency;
  } catch {
    return '$';
  }
}

/** Number input shown in local currency that reports USD through onUsd. */
export function MoneyInput({ usd, onUsd, ...props }) {
  const [text, setText] = useState(() => (usd ? String(fromUSD(usd)) : ''));
  return (
    <input
      type="number"
      inputMode="decimal"
      step="0.01"
      {...props}
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        onUsd(toUSD(Number(e.target.value) || 0));
      }}
    />
  );
}
