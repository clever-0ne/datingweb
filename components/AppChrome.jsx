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
import ThemeToggle from '@/components/ThemeToggle';

const ICONS = {
  LayoutDashboard, ArrowDownToLine, ArrowUpFromLine, TrendingUp, BarChart3,
  Car, Bitcoin, Cpu, User, Receipt,
};

/** Status dot colour per notification kind (see lib/notifications.js). */
const NOTIF_DOT = { success: 'var(--green)', error: 'var(--red)', info: 'var(--primary)' };

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
  // Never wrap either in the user chrome.
  if (isPublic) return children;

  // Waiting on the one wallet request. A blank div here reads as a broken page,
  // so show a quiet placeholder instead.
  if (authed !== true) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span
          className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent"
          style={{ borderColor: 'var(--hairline-strong)', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  const NavItem = ({ item }) => {
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
        className={`fixed inset-y-0 left-0 z-[60] w-72 transform border-r transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ background: 'var(--chrome-grad)', borderColor: 'var(--hairline)' }}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between px-6" style={{ borderBottom: '1px solid var(--hairline)' }}>
            <Link href="/dashboard" onClick={() => setSidebarOpen(false)}>
              <img src="/assets/logo.svg" alt="Tesla Capital" className="logo" style={{ height: 15, width: 'auto' }} />
            </Link>
            <button className="icon-btn lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close">
              <X size={18} />
            </button>
          </div>

          <div className="flex items-center space-x-3 px-6 py-4" style={{ borderBottom: '1px solid var(--hairline)' }}>
            <div
              className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full"
              style={{ background: 'var(--soft-2)', color: 'var(--text)' }}
            >
              {user?.profileImage ? <img src={user.profileImage} alt="" className="h-full w-full object-cover" /> : <User size={18} />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="hi truncate text-sm font-semibold">{user?.name || 'Account'}</p>
              <p className="mut truncate text-xs">{user?.email || ''}</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            {NAV.map((item) => (
              <NavItem key={item.href} item={item} />
            ))}
          </nav>

          <div className="p-4" style={{ borderTop: '1px solid var(--hairline)' }}>
            <button
              type="button"
              onClick={logout}
              className="mut hover-tx flex w-full items-center gap-2 px-1 text-sm font-medium"
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
            style={{ background: 'var(--chrome)', borderBottom: '1px solid var(--hairline)' }}
          >
            <div className="flex min-w-0 items-center">
              <button className="icon-btn mr-2 lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Menu">
                <Menu size={20} />
              </button>
              <div className="hi min-w-0 flex-1 truncate text-[15px] font-semibold sm:text-lg">
                {NAV.find((n) => isActive(n.href))?.label || 'Dashboard'}
              </div>
            </div>
            <div className="relative ml-2 flex flex-shrink-0 items-center">
              {/* The theme switch sits with the bell because both are quiet,
                  app-wide controls rather than destinations. */}
              <ThemeToggle />
              <button className="icon-btn relative" onClick={toggleNotif} aria-label="Notifications">
                <Bell size={20} />
                {/* text-white, not the `hi` token: this one really is white
                    text, because the surface behind it is red in both themes. */}
                {unread > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ef4444] px-1 text-[10px] font-bold text-white">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div
                  className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-2xl border shadow-2xl"
                  style={{ background: 'var(--chrome)', borderColor: 'var(--hairline-strong)' }}
                >
                  <div className="border-b p-3" style={{ borderColor: 'var(--hairline)' }}>
                    <h3 className="hi text-sm font-semibold">Notifications</h3>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="mut p-4 text-center text-xs">No notifications</div>
                  ) : (
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          className="border-b p-3 last:border-0"
                          style={{ borderColor: 'var(--hairline)' }}
                        >
                          <div className="flex items-start gap-2">
                            <span
                              className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                              style={{ background: NOTIF_DOT[n.kind] || NOTIF_DOT.info }}
                            />
                            <div className="min-w-0">
                              <p className="hi text-xs font-semibold">{n.title}</p>
                              <p className="mut mt-0.5 break-words text-[11px] leading-relaxed">{n.body}</p>
                              <p className="faint mt-1 text-[10px]">
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
        <footer
          className="mt-auto border-t pt-6 pb-24 lg:pb-6"
          style={{ borderColor: 'var(--hairline)', background: 'var(--chrome-2)' }}
        >
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 sm:px-6 md:flex-row">
            <p className="mut text-xs">&copy; 2026 Tesla Capital. All rights reserved.</p>
            <div className="mut flex items-center gap-4 text-xs">
              <Link href="/terms" className="hover-tx">Terms of Service</Link>
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
