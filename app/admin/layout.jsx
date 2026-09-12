'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Shield, Sun, Moon } from 'lucide-react';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authed, setAuthed] = useState(null);
  const [theme, setTheme] = useState('light');

  const isLogin = pathname === '/admin/login';

  // Console surfaces are always light; opt the body into the console palette.
  // The login screen is the exception — it uses the dark auth ground, and the
  // two body classes would fight over the same background.
  useEffect(() => {
    if (isLogin) {
      // A previous console session may have left the dark class on <html>;
      // the auth screen is always dark-on-its-own-terms, so clear it.
      document.documentElement.classList.remove('dark');
      return;
    }
    document.body.classList.add('admin-console');
    const stored = localStorage.getItem('theme');
    const initial = stored === 'dark' ? 'dark' : 'light';
    setTheme(initial);
    document.documentElement.classList.toggle('dark', initial === 'dark');
    return () => {
      document.body.classList.remove('admin-console');
      document.documentElement.classList.remove('dark');
    };
  }, [isLogin]);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  useEffect(() => {
    if (isLogin) return;
    fetch('/api/admin/session')
      .then((r) => r.json())
      .then((d) => setAuthed(!!d.ok))
      .catch(() => setAuthed(false));
  }, [isLogin, pathname]);

  useEffect(() => {
    if (authed === false && !isLogin) router.replace('/admin/login');
  }, [authed, isLogin, router]);

  if (isLogin) return <>{children}</>;

  if (authed !== true) {
    return <div className="min-h-screen bg-gray-200" />;
  }

  const logout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch (e) {
      /* fall through — the cookie is cleared server-side on the next request */
    }
    window.location.href = '/admin/login';
  };

  return (
    <div className="font-sans antialiased text-slate-900">
      {/* Top Navigation — solid, not translucent. On a phone this is the only
          chrome the console has, so it stays opaque and its controls stay light
          enough to read against the dark bar (the theme toggle used to be
          slate-500 on slate-950, which is very close to invisible). */}
      <nav className="fixed inset-x-0 top-0 z-[100] border-b border-white/10 bg-slate-950">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <span className="flex shrink-0 items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/logo.svg" alt="Tesla Capital" className="h-5 w-auto filter brightness-0 invert" />
              </span>
              <span className="hidden shrink-0 items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-900 sm:inline-flex">
                <Shield className="mr-1 h-3 w-3 text-purple" />
                Admin Console
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                className="rounded-full p-2 text-slate-200 transition hover:bg-white/10 hover:text-white"
                aria-label="Toggle dark mode"
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              <button
                type="button"
                onClick={logout}
                className="rounded-full border border-white/25 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10 sm:px-4 sm:text-sm"
              >
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-3 pb-16 pt-20 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
