'use client';

import { useEffect } from 'react';
import { Shield } from 'lucide-react';

export const authInputCls =
  'w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm text-black placeholder:text-slate-400 outline-none transition focus:border-black focus:ring-2 focus:ring-black/20';

export const authLabelCls = 'mb-1 block text-xs font-medium text-slate-700';

export const authBtnCls =
  'w-full rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-black/40 focus:ring-offset-2 focus:ring-offset-white disabled:opacity-60';

/**
 * Shared auth chrome for both the user site (/login, /register) and the
 * standalone admin console (/admin/login). `badge` swaps the wordmark for a
 * labelled pill — the console uses it so the two entry points stay visually
 * distinct, which matters because they are separate auth systems.
 */
export default function AuthShell({ title, subtitle, badge, children }) {
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
              <a href="/" className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/logo.svg" alt="Tesla Capital" className="h-5 w-auto invert" />
                <span className="text-sm font-semibold tracking-tight text-white">Tesla Capital</span>
                {badge && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium text-white">
                    <Shield className="h-3 w-3 text-purple" />
                    {badge}
                  </span>
                )}
              </a>
              {/* Plain anchor, not <Link>: the landing page loads its theme
                  stylesheets and scripts as part of the document, so it needs
                  a full page load to initialise the slider and counters. */}
              <a href="/" className="text-xs font-medium text-slate-300 transition hover:text-white">
                Back to home
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
