'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, ArrowDownToLine, ArrowUpFromLine, TrendingUp, BarChart3,
  Car, Bitcoin, Cpu, User, Menu, X, Bell, LogOut, ShieldCheck, Receipt,
} from 'lucide-react';
import { NAV, BOTTOM_NAV, isPublicRoute } from '@/lib/nav';
import { useWallet } from '@/lib/wallet';

const ICONS = {
  LayoutDashboard, ArrowDownToLine, ArrowUpFromLine, TrendingUp, BarChart3,
  Car, Bitcoin, Cpu, User, Receipt,
};

/** Status dot colour per notification kind (see lib/notifications.js). */
const NOTIF_DOT = { success: '#2f8a68', error: '#ef4444', info: '#2f6dff' };

export default function AppChrome({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  // Everything this shell needs — who is signed in, their name, and the
  // notifications behind the bell — arrives in the one /api/wallet response.
  // This used to fire a second request to /api/auth/me and render nothing at
  // all until it came back, which doubled the blank wait on every navigation.
  const { notifications, markNotificationsRead, authed, user } = useWallet();
  const unread = notifications.filter((n) => !n.read).length;

  // Opening the bell clears the unread badge. The notifications themselves stay
  // put, so a payout code can still be read back later.
  const toggleNotif = () => {
    const opening = !notifOpen;
    setNotifOpen(opening);
    if (opening && unread) markNotificationsRead();
  };

  const isPublic = isPublicRoute(pathname);

  useEffect(() => {
    if (!isPublic && authed === false) router.replace('/login');
  }, [authed, isPublic, router]);

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      /* fall through — the cookie is cleared server-side on the next request */
    }
    window.location.href = '/login';
  };

  const isActive = (href) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  // The admin panel is a completely separate app with its own shell
  // (see app/console-006cd676/layout.jsx), and the public pages have no shell at all.
  // Never wrap either in the dark user chrome.
  if (isPublic) return children;

  // Waiting on the one wallet request. A blank div here reads as a broken page,
  // so show a quiet placeholder instead.
  if (authed !== true) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-slate-600 border-t-transparent" />
      </div>
    );
  }

  const NavItem = ({ item, activeCls }) => {
    const Icon = ICONS[item.icon] || LayoutDashboard;
    return (
      <Link
        href={item.href}
        className={`nav-link${isActive(item.href) ? ' active' : ''}`}
        onClick={() => setSidebarOpen(false)}
      >
        <Icon size={16} />
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-[60] w-72 transform border-r bg-[linear-gradient(180deg,#111a2a,#0c1220)] transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ borderColor: 'rgba(148,163,184,.12)' }}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between px-6" style={{ borderBottom: '1px solid rgba(148,163,184,.12)' }}>
            <Link href="/dashboard" onClick={() => setSidebarOpen(false)}>
              <img src="/assets/logo.svg" alt="Tesla Capital" className="logo" style={{ height: 15, width: 'auto' }} />
            </Link>
            <button className="text-slate-300 lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close">
              <X size={18} />
            </button>
          </div>

          <div className="flex items-center space-x-3 px-6 py-4" style={{ borderBottom: '1px solid rgba(148,163,184,.12)' }}>
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#1e2430] text-white">
              {user?.profileImage ? <img src={user.profileImage} alt="" className="h-full w-full object-cover" /> : <User size={18} />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{user?.name || 'Account'}</p>
              <p className="truncate text-xs text-slate-400">{user?.email || ''}</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            {NAV.map((item) => (
              <NavItem key={item.href} item={item} />
            ))}
          </nav>

          <div className="p-4" style={{ borderTop: '1px solid rgba(148,163,184,.12)' }}>
            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center gap-2 px-1 text-sm font-medium text-slate-400 hover:text-white"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-h-screen flex-1 flex-col lg:ml-72">
        {/* Topbar */}
        <header className="sticky top-0 z-30">
          <div
            className="flex items-center justify-between px-4 py-2.5 sm:px-6"
            style={{ background: '#0d1421', borderBottom: '1px solid rgba(148,163,184,.12)' }}
          >
            <div className="flex min-w-0 items-center">
              <button className="mr-2 text-slate-300 lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Menu">
                <Menu size={20} />
              </button>
              <div className="min-w-0 flex-1 truncate text-[15px] font-semibold text-white sm:text-lg">
                {NAV.find((n) => isActive(n.href))?.label || 'Dashboard'}
              </div>
            </div>
            <div className="relative ml-2 flex flex-shrink-0 items-center">
              <button className="relative rounded-full p-2 text-slate-300" onClick={toggleNotif} aria-label="Notifications">
                <Bell size={20} />
                {unread > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ef4444] px-1 text-[10px] font-bold text-white">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-2xl border bg-[#141a29] shadow-2xl" style={{ borderColor: 'rgba(148,163,184,.15)' }}>
                  <div className="border-b p-3" style={{ borderColor: 'rgba(148,163,184,.12)' }}>
                    <h3 className="text-sm font-semibold text-white">Notifications</h3>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">No notifications</div>
                  ) : (
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          className="border-b p-3 last:border-0"
                          style={{ borderColor: 'rgba(148,163,184,.1)' }}
                        >
                          <div className="flex items-start gap-2">
                            <span
                              className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                              style={{ background: NOTIF_DOT[n.kind] || NOTIF_DOT.info }}
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-white">{n.title}</p>
                              <p className="mt-0.5 break-words text-[11px] leading-relaxed text-slate-400">{n.body}</p>
                              <p className="mt-1 text-[10px] text-slate-500">
                                {new Date(n.createdAt).toLocaleString(undefined, {
                                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 pb-24 sm:p-6 lg:pb-6">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>

        {/* Footer */}
        {/* pb-24 on phones: the tab bar floats over this row rather than sitting
            above it, so the footer has to clear the bar itself. */}
        <footer className="mt-auto border-t pt-6 pb-24 lg:pb-6" style={{ borderColor: 'rgba(148,163,184,.12)', background: '#0d1220' }}>
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 sm:px-6 md:flex-row">
            <p className="text-xs text-slate-400">&copy; 2026 Tesla Capital. All rights reserved.</p>
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <Link href="/terms" className="hover:text-white">Terms of Service</Link>
              <span>Privacy Policy</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Mobile bottom nav — a floating glass bar rather than a flush strip.
          The styles live in globals.css under "Floating tab bar": a blur, a
          saturation boost and a lit top edge, which is the whole of the
          material and none of which works without the other two. */}
      <nav className="tab-glass lg:hidden" aria-label="Primary">
        <div className="tab-glass__inner">
          {BOTTOM_NAV.map((item) => {
            const Icon = ICONS[item.icon] || LayoutDashboard;
            const on = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={on ? 'page' : undefined}
                className={`tab-glass__item ${on ? 'is-on' : ''}`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
