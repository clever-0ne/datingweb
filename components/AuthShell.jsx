'use client';

import { useEffect } from 'react';

export const authInputCls =
  'w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm text-black placeholder:text-slate-400 outline-none transition focus:border-black focus:ring-2 focus:ring-black/20';

export const authLabelCls = 'mb-1 block text-xs font-medium text-slate-700';

export const authBtnCls =
  'w-full rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-black/40 focus:ring-offset-2 focus:ring-offset-white disabled:opacity-60';

/**
 * Shared auth chrome for both the user site (/login, /register) and the
 * standalone admin console (/admin/login).
 *
 * `variant` picks how much header the page gets:
 *   'app'     — the customer pages. The wordmark alone, small.
 *   'console' — the admin login. The wordmark alone and nothing else.
 *
 * Both variants show the mark on its own: /assets/logo.svg already *is* the
 * TESLA wordmark, so the "Tesla Capital" text that used to sit beside it said
 * the same thing twice and made the bar read as cluttered. The mark is itself
 * an <a href="/">, so dropping the separate "Back to home" link costs nothing.
 */
export default function AuthShell({ title, subtitle, variant = 'app', children }) {
  const isConsole = variant === 'console';

  useEffect(() => {
    document.body.classList.add('auth-page');
    return () => document.body.classList.remove('auth-page');
  }, []);

  return (
    <div className="page-auth font-sans antialiased text-slate-900">
      <div className="flex min-h-screen flex-col">
        {/* Dark header */}
        <header className="border-b border-white/10 bg-black/90 backdrop-blur-xl">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <a href="/" className="flex items-center" aria-label="Tesla Capital — home">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/logo.svg"
                  alt="Tesla Capital"
                  className={`w-auto invert ${isConsole ? 'h-5' : 'h-2'}`}
                />
              </a>
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="flex flex-1 items-center justify-center px-4 py-10">
          <div className="w-full max-w-sm auth-glow">
            <div className="relative z-10 auth-card hairline rounded-2xl p-6 shadow-2xl">
              <div className="mb-6 text-center">
                <h1 className="text-xl font-bold tracking-tight text-black">{title}</h1>
                <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
              </div>
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
