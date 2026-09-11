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
      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200/60 bg-slate-950 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <span className="flex items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/logo.svg" alt="Tesla" className="h-2 w-auto filter brightness-0 invert" />
              </span>
              <span className="hidden sm:inline-flex items-center rounded-full bg-slate-100 text-slate-900 px-3 py-1 text-xs font-medium">
                <Shield className="mr-1 h-3 w-3 text-purple" />Admin Console
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 rounded-full text-slate-500 transition hover:bg-slate-100 dark:hover:bg-white/10"
                aria-label="Toggle dark mode"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                type="button"
                onClick={logout}
                className="rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
              >
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">{children}</main>
    </div>
  );
}
