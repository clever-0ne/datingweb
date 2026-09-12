'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { COINS } from '@/lib/coins';

/** Card skeletons for the settings tab, used only when the console has no
 *  saved coins yet. Addresses start blank — the admin fills them in. */
const BLANK_COINS = COINS.map(({ symbol, name, network, rate }) => ({
  symbol,
  name,
  network,
  rate,
  address: '',
}));

/* ---------------- helpers ---------------- */

async function api(url, opts = {}) {
  const res = await fetch(url, {
    credentials: 'include',
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

const fmtMoney = (n) =>
  Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (ts) =>
  ts
    ? new Date(ts).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';

function kycLabel(status) {
  if (status === 'approved') return 'KYC Approved';
  if (status === 'submitted') return 'KYC Pending';
  return 'KYC Not Submitted';
}

function StatusBadge({ status }) {
  const color =
    status === 'approved' || status === 'released'
      ? 'bg-success-bg text-[#166534]'
      : status === 'pending'
        ? 'bg-[#fff3e7] text-[#9a3412]'
        : status === 'rejected'
          ? 'bg-[#fceceb] text-[#b91c1c]'
          : 'bg-gray-100 text-slate-600 dark:bg-white/10 dark:text-gray-300';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>
      {status}
    </span>
  );
}

function TypeBadge({ type }) {
  const color =
    type === 'investment'
      ? 'bg-[#f3edfc] text-[#6d28d9]'
      : type === 'crypto'
        ? 'bg-[#fff3e7] text-[#9a3412]'
        : type === 'vehicle'
          ? 'bg-[#e9f0fc] text-[#1e40af]'
          : 'bg-gray-100 text-slate-600 dark:bg-white/10 dark:text-gray-300';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>
      {type}
    </span>
  );
}

const inputCls =
  'w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-black focus:border-tesla focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white';

const saveBtnCls =
  'shrink-0 rounded-full bg-gray-200 px-5 py-2 text-xs font-medium text-slate-900 transition hover:bg-gray-300 dark:bg-white/10 dark:text-white dark:hover:bg-white/20';

/* ================================================================== */

export default function AdminConsole() {
  const [tab, setTab] = useState('users');

  const [users, setUsers] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [orders, setOrders] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const [selectedId, setSelectedId] = useState(null);
  const [txModal, setTxModal] = useState(null); // 'deposits' | 'withdrawals' | 'orders'

  const [settings, setSettings] = useState({ coins: [] });
  const [dashboardStats, setDashboardStats] = useState({
    totalProfit: 0,
    bonus: 0,
    totalDeposit: 0,
    totalWithdrawal: 0,
  });

  const [settingsMsg, setSettingsMsg] = useState('');
  const [statsMsg, setStatsMsg] = useState('');
  const [balanceMsg, setBalanceMsg] = useState('');
  const [userStatsMsg, setUserStatsMsg] = useState('');

  const currentUser = users.find((u) => u.id === selectedId) || null;

  /* ---------------- data loading ---------------- */

  const loadUsers = useCallback(async () => {
    const [u, d, w, o, p, ip] = await Promise.all([
      api('/api/admin/users'),
      api('/api/admin/deposits'),
      api('/api/admin/withdrawals'),
      api('/api/admin/orders'),
      api('/api/admin/mining-withdrawals'),
      api('/api/admin/investment-withdrawals'),
    ]);
    if (u.ok) setUsers((u.data.users || []).filter((x) => x.role !== 'admin'));
    if (d.ok) setDeposits(d.data.deposits || []);
    if (w.ok) setWithdrawals(w.data.withdrawals || []);
    if (o.ok) setOrders(o.data.orders || []);
    // Both payout queues share one list — they carry a `kind` discriminator, and
    // the decision endpoint is the only thing that differs between them.
    const queues = [
      ...(p.ok ? p.data.miningWithdrawals || [] : []),
      ...(ip.ok ? ip.data.investmentWithdrawals || [] : []),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    setPayouts(queues);
    setLoaded(true);
  }, []);

  const loadSettings = useCallback(async () => {
    const [s, d] = await Promise.all([api('/api/admin/settings'), api('/api/admin/dashboard-stats')]);
    // An empty list would render no cards at all, leaving nowhere to type an
    // address — so fall back to a blank skeleton with the same coins the user
    // site knows about. The addresses fill in as the admin saves them.
    if (s.ok) {
      const saved = s.data.settings?.coins || [];
      setSettings({ coins: saved.length ? saved : BLANK_COINS });
    }
    if (d.ok) {
      const v = d.data.dashboardStats || {};
      setDashboardStats({
        totalProfit: v.totalProfit || 0,
        bonus: v.bonus || 0,
        totalDeposit: v.totalDeposit || 0,
        totalWithdrawal: v.totalWithdrawal || 0,
      });
    }
  }, []);

  useEffect(() => {
    // Approvals reads the same bundle as Users (payouts arrive with it).
    if (tab === 'users' || tab === 'approvals') loadUsers();
    if (tab === 'settings') loadSettings();
  }, [tab, loadUsers, loadSettings]);

  // Poll the transaction queues so a user's new deposit / withdrawal / payout
  // request appears in the console the moment it is submitted, without a manual
  // reload. Settings is deliberately excluded — polling it would overwrite an
  // in-progress edit to a coin address with the last-saved value.
  useEffect(() => {
    // 15s, and only while the tab is visible.
    let id = setInterval(() => {
      if (tab === 'users' || tab === 'approvals') loadUsers();
    }, 15000);
    const onVis = () => {
      clearInterval(id);
      if (!document.hidden) {
        id = setInterval(() => {
          if (tab === 'users' || tab === 'approvals') loadUsers();
        }, 15000);
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [tab, loadUsers]);

  const pendingFor = (userId) =>
    deposits.filter((d) => d.userId === userId && d.status === 'pending').length +
    withdrawals.filter((w) => w.userId === userId && w.status === 'pending').length +
    payouts.filter((p) => p.userId === userId && p.status === 'pending').length;

  const pendingPayouts = payouts.filter((p) => p.status === 'pending').length;

  /* ---------------- user actions ---------------- */

  const patchUser = async (id, body) => {
    const r = await api(`/api/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
    if (r.ok) setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...r.data.user } : u)));
    return r;
  };

  const saveBalance = async () => {
    const value = Number(currentUser.balance);
    const r = await patchUser(currentUser.id, { balance: value });
    setBalanceMsg(r.ok ? 'Balance updated.' : r.data.error || 'Update failed.');
  };

  const saveUserDashboardStats = async () => {
    const r = await api(`/api/admin/users/${currentUser.id}/dashboard-stats`, {
      method: 'POST',
      body: JSON.stringify({ totalProfit: currentUser.dashboardStats?.totalProfit, bonus: currentUser.dashboardStats?.bonus }),
    });
    setUserStatsMsg(r.ok ? 'Stats updated.' : r.data.error || 'Update failed.');
  };

  const setUserStatField = (key, value) =>
    setUsers((prev) =>
      prev.map((u) =>
        u.id === currentUser.id ? { ...u, dashboardStats: { ...(u.dashboardStats || {}), [key]: value } } : u,
      ),
    );

  const saveUserKyc = async (status) => {
    const r = await patchUser(currentUser.id, { kycStatus: status });
    if (!r.ok) alert(r.data.error || 'Update failed.');
  };

  const clearUserKyc = async () => {
    if (!confirm('Clear all KYC documents and reset status?')) return;
    const r = await api(`/api/admin/users/${currentUser.id}/clear-kyc`, { method: 'POST' });
    if (r.ok) setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? { ...u, ...r.data.user } : u)));
    else alert(r.data.error || 'Clear failed.');
  };

  const toggleUserBlock = async () => {
    const willBlock = !currentUser.blocked;
    const r = await api(`/api/admin/users/${currentUser.id}/block`, {
      method: 'PATCH',
      body: JSON.stringify({ blocked: willBlock }),
    });
    if (r.ok) setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? { ...u, blocked: willBlock } : u)));
    else alert(r.data.error || 'Action failed.');
  };

  const deleteUser = async () => {
    if (
      !confirm(
        `Delete ${currentUser.name}? This removes the account, sessions, deposits and orders. This cannot be undone.`,
      )
    )
      return;
    const r = await api(`/api/admin/users/${currentUser.id}`, { method: 'DELETE' });
    if (r.ok) {
      setSelectedId(null);
      loadUsers();
    } else alert(r.data.error || 'Delete failed.');
  };

  const reviewDeposit = async (id, status) => {
    const r = await api(`/api/admin/deposits/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    if (r.ok) {
      setDeposits((prev) => prev.map((d) => (d.id === id ? { ...d, status } : d)));
      loadUsers(); // balance may have moved
    } else alert(r.data.error || 'Review failed.');
  };

  const reviewWithdrawal = async (id, status) => {
    const verb = status === 'approved' ? 'Approve' : 'Reject';
    const extra = status === 'approved' ? " The user's balance will be debited." : '';
    if (!confirm(`${verb} this withdrawal?${extra}`)) return;
    const r = await api(`/api/admin/withdrawals/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    if (r.ok) {
      setWithdrawals((prev) => prev.map((w) => (w.id === id ? { ...w, status } : w)));
      loadUsers();
    } else alert(r.data.error || 'Review failed.');
  };

  /**
   * Payouts are two-key: approving sends the user a six-digit code but moves no
   * money — the balance only changes when the user enters that code. Mining and
   * investment queues work identically; only the endpoint differs.
   */
  const reviewPayout = async (payout, status) => {
    const kind = payout.kind === 'Investment' ? 'investment' : 'mining';
    let reason = '';
    if (status === 'approved') {
      if (!confirm(`Approve this ${kind} payout? A verification code will be sent to the user's notifications. No balance moves until they enter it.`)) return;
    } else {
      reason = prompt('Reason for rejecting this payout (shown to the user):') ?? null;
      if (reason === null) return;
    }
    const r = await api(`/api/admin/${kind}-withdrawals/${payout.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    });
    if (r.ok) setPayouts((prev) => prev.map((p) => (p.id === payout.id ? { ...p, ...r.data.request } : p)));
    else alert(r.data.error || 'Review failed.');
  };

  /* ---------------- settings actions ---------------- */

  const setCoinField = (index, key, value) =>
    setSettings((prev) => ({
      coins: prev.coins.map((c, i) => (i === index ? { ...c, [key]: value } : c)),
    }));

  const saveSettings = async () => {
    const r = await api('/api/admin/settings', {
      method: 'POST',
      body: JSON.stringify({ coins: settings.coins.map((c) => ({ ...c, rate: Number(c.rate) })) }),
    });
    setSettingsMsg(r.ok ? 'Settings saved.' : r.data.error || 'Save failed.');
  };

  const saveDashboardStats = async () => {
    const r = await api('/api/admin/dashboard-stats', {
      method: 'POST',
      body: JSON.stringify(dashboardStats),
    });
    setStatsMsg(r.ok ? 'Dashboard stats saved.' : r.data.error || 'Save failed.');
  };

  /* ---------------- render ---------------- */

  const tabCls = (name) =>
    `flex-1 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition ${
      tab === name ? 'bg-gray-200 text-slate-900 dark:bg-white/15 dark:text-white' : 'text-slate-500 dark:text-gray-300'
    }`;

  return (
    <>
      {/* Tabs */}
      <div className="mb-6 flex items-center gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm dark:border-white/10 dark:bg-slate-900">
        <button type="button" onClick={() => setTab('users')} className={tabCls('users')}>
          Users
        </button>
        <button type="button" onClick={() => setTab('approvals')} className={tabCls('approvals')}>
          Approvals
          {pendingPayouts > 0 && (
            <span className="ml-2 inline-flex items-center rounded-full bg-[#fff3e7] px-2 py-0.5 text-[11px] font-semibold text-[#9a3412] dark:bg-[#f59e0b]/20 dark:text-[#fbbf24]">
              {pendingPayouts}
            </span>
          )}
        </button>
        <button type="button" onClick={() => setTab('settings')} className={tabCls('settings')}>
          Settings
        </button>
      </div>

      {/* ===================== Users ===================== */}
      {tab === 'users' && (
        <section>
          {!currentUser ? (
            <div className="glass-card p-4 sm:p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-medium text-black dark:text-white">User Accounts</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Pick a user and click Manage to view their full portfolio, balance, KYC, and activity.
                  </p>
                </div>
                <span
                  id="user-count"
                  className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-white/10 dark:text-slate-300"
                >
                  {users.length} {users.length === 1 ? 'user' : 'users'}
                </span>
              </div>

              <div className="space-y-2">
                {!loaded && <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">Loading…</p>}
                {loaded && !users.length && (
                  <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    No user accounts yet. They appear here once someone creates an account.
                  </p>
                )}
                {users.map((u) => {
                  const pending = pendingFor(u.id);
                  return (
                    <div
                      key={u.id}
                      className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-gray-300 hover:bg-gray-50 sm:flex-row sm:items-center dark:border-white/10 dark:bg-slate-800 dark:hover:bg-white/5"
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedId(u.id)}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-slate-900 dark:bg-white/10 dark:text-white">
                          {u.profileImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={u.profileImage} alt="" className="h-full w-full rounded-full object-cover" />
                          ) : (
                            (u.name || '?').charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-black dark:text-white">
                            {u.name}
                            {pending > 0 && (
                              <span className="ml-1 inline-block rounded-full bg-[#fff3e7] px-2 py-0.5 text-[10px] font-semibold text-[#9a3412]">
                                {pending} pending
                              </span>
                            )}
                            {u.blocked && (
                              <span className="ml-1 inline-block rounded-full bg-[#fecaca] px-2 py-0.5 text-[10px] font-semibold text-[#b91c1c]">
                                Blocked
                              </span>
                            )}
                          </p>
                          <p className="truncate text-xs text-slate-500 dark:text-slate-400">{u.email}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-medium text-success">${fmtMoney(u.balance)}</p>
                          <p className="text-xs text-slate-400">{kycLabel(u.kycStatus)}</p>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedId(u.id)}
                        className="shrink-0 rounded-full bg-tesla px-4 py-2 text-center text-xs font-medium text-white transition hover:bg-tesla-600 sm:py-1.5 dark:bg-white dark:text-slate-900"
                      >
                        Manage User
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div>
              <button
                type="button"
                onClick={() => {
                  setSelectedId(null);
                  setBalanceMsg('');
                  setUserStatsMsg('');
                  loadUsers();
                }}
                className="mb-4 inline-flex items-center text-xs font-medium text-slate-500 transition hover:text-black dark:text-slate-400 dark:hover:text-white"
              >
                <ArrowLeft className="mr-1 w-3.5 h-3.5" />
                Back to Users
              </button>

              <UserDetail
                user={currentUser}
                deposits={deposits.filter((d) => d.userId === currentUser.id)}
                withdrawals={withdrawals.filter((w) => w.userId === currentUser.id)}
                orders={orders.filter((o) => o.userId === currentUser.id)}
                balanceMsg={balanceMsg}
                userStatsMsg={userStatsMsg}
                onBalanceChange={(v) => patchUserLocal(setUsers, currentUser.id, { balance: v })}
                onStatChange={setUserStatField}
                onSaveBalance={saveBalance}
                onSaveStats={saveUserDashboardStats}
                onKyc={(v) => saveUserKyc(v)}
                onClearKyc={clearUserKyc}
                onToggleBlock={toggleUserBlock}
                onDelete={deleteUser}
                onViewAll={setTxModal}
                onReviewDeposit={reviewDeposit}
                onReviewWithdrawal={reviewWithdrawal}
              />
            </div>
          )}
        </section>
      )}

      {/* ===================== Approvals ===================== */}
      {tab === 'approvals' && (
        <section className="glass-card p-4 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-medium text-black dark:text-white">Mining Payout Approvals</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Approving sends the user a six-digit code. No balance moves until they enter it.
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-white/10 dark:text-slate-300">
              {pendingPayouts} pending
            </span>
          </div>

          <div className="space-y-2">
            {!loaded && (
              <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">Loading…</p>
            )}
            {loaded && !payouts.length && (
              <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                No payout requests yet. They appear here when a user cashes out a matured contract or investment plan.
              </p>
            )}
            {payouts.map((p) => (
              <div
                key={p.id}
                className="rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-800"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-black dark:text-white">
                      {p.userName}
                      <span className="ml-2 font-mono text-[11px] font-normal text-slate-400">{p.id}</span>
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      <span className="mr-1.5 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-white/10 dark:text-slate-300">
                        {p.kind || 'Mining'}
                      </span>
                      {p.items} {p.itemLabel || 'contracts'} · {fmtDate(p.createdAt)}
                      {p.userEmail ? ` · ${p.userEmail}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-right text-xs text-slate-500 dark:text-slate-400">
                      <span className="block font-medium text-black dark:text-white">${fmtMoney(p.gross)}</span>
                      <span className="block">
                        credited on release · ${fmtMoney(p.fee)} fee{' '}
                        {p.feeRefundedAt ? 'refunded' : p.feeChargedAt ? 'already charged' : 'not charged'}
                      </span>
                    </span>
                    <StatusBadge status={p.status} />
                    {p.status === 'pending' && (
                      <span className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => reviewPayout(p, 'approved')}
                          className="rounded-full bg-success-bg px-4 py-1.5 text-xs font-medium text-[#166534] transition hover:brightness-95"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => reviewPayout(p, 'rejected')}
                          className="rounded-full border border-[#fca5a5] px-4 py-1.5 text-xs font-medium text-[#b91c1c] transition hover:bg-[#fef2f2] dark:border-[#ef4444]/40 dark:text-danger dark:hover:bg-[#ef4444]/10"
                        >
                          Reject
                        </button>
                      </span>
                    )}
                  </div>
                </div>
                {p.status === 'approved' && p.attempts > 0 && (
                  <p className="mt-2 text-[11px] text-[#9a3412] dark:text-[#fbbf24]">
                    {p.attempts} incorrect code{p.attempts === 1 ? '' : 's'} entered so far.
                  </p>
                )}
                {p.status === 'rejected' && p.rejectReason && (
                  <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                    Reason: {p.rejectReason}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ===================== Settings ===================== */}
      {tab === 'settings' && (
        <section>
          <div className="glass-card p-4 sm:p-6">
            <h3 className="mb-1 text-base font-medium text-black dark:text-white">Deposit Addresses &amp; Rates</h3>
            <p className="mb-6 text-xs text-slate-500 dark:text-slate-400">
              These addresses are shown to users in the deposit modal. Rates are used to compute the coin amount a
              user must send.
            </p>

            {settingsMsg && (
              <div className="mb-4 rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#15803d] dark:border-[#22c55e]/30 dark:bg-[#22c55e]/10 dark:text-[#4ade80]">
                {settingsMsg}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {settings.coins.map((c, i) => (
                <div
                  key={c.symbol || i}
                  className="rounded-xl border border-slate-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-white/5"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-medium text-black dark:text-white">{c.name || c.symbol}</p>
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-white/10 dark:text-slate-300">
                      {c.symbol}
                    </span>
                  </div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Deposit address
                  </label>
                  <input
                    type="text"
                    value={c.address || ''}
                    onChange={(e) => setCoinField(i, 'address', e.target.value)}
                    className={`${inputCls} mb-3 font-mono text-xs`}
                  />
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Rate (USD per {c.symbol})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={c.rate ?? ''}
                    onChange={(e) => setCoinField(i, 'rate', e.target.value)}
                    className={inputCls}
                  />
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={saveSettings}
              className="mt-6 w-full rounded-full bg-gray-200 px-6 py-2.5 text-sm font-medium text-slate-900 shadow-lg transition hover:bg-gray-300 sm:w-auto dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
            >
              Save Settings
            </button>
          </div>

          <div className="glass-card p-4 sm:p-6 mt-6">
            <h3 className="mb-1 text-base font-medium text-black dark:text-white">Dashboard Stats</h3>
            <p className="mb-6 text-xs text-slate-500 dark:text-slate-400">
              Control the numbers shown on the user dashboard overview cards.
            </p>

            {statsMsg && (
              <div className="mb-4 rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#15803d] dark:border-[#22c55e]/30 dark:bg-[#22c55e]/10 dark:text-[#4ade80]">
                {statsMsg}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {[
                ['totalProfit', 'Total Profit'],
                ['bonus', 'Bonus / Rewards & Promotions'],
                ['totalDeposit', 'Total Deposit'],
                ['totalWithdrawal', 'Total Withdrawal'],
              ].map(([key, label]) => (
                <div key={key}>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">{label}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={dashboardStats[key] ?? ''}
                    onChange={(e) => setDashboardStats((s) => ({ ...s, [key]: e.target.value }))}
                    className={inputCls}
                  />
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={saveDashboardStats}
              className="mt-6 w-full rounded-full bg-gray-200 px-6 py-2.5 text-sm font-medium text-slate-900 shadow-lg transition hover:bg-gray-300 sm:w-auto dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
            >
              Save Dashboard Stats
            </button>
          </div>
        </section>
      )}

      {/* All-transactions modal */}
      {txModal && currentUser && (
        <TxModal
          kind={txModal}
          user={currentUser}
          deposits={deposits.filter((d) => d.userId === currentUser.id)}
          withdrawals={withdrawals.filter((w) => w.userId === currentUser.id)}
          orders={orders.filter((o) => o.userId === currentUser.id)}
          onClose={() => setTxModal(null)}
          onReviewDeposit={reviewDeposit}
          onReviewWithdrawal={reviewWithdrawal}
        />
      )}
    </>
  );
}

/* ---------------- local state helper ---------------- */

function patchUserLocal(setUsers, id, patch) {
  setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));
}

/* ---------------- user detail ---------------- */

function UserDetail({
  user,
  deposits,
  withdrawals,
  orders,
  balanceMsg,
  userStatsMsg,
  onBalanceChange,
  onStatChange,
  onSaveBalance,
  onSaveStats,
  onKyc,
  onClearKyc,
  onToggleBlock,
  onDelete,
  onViewAll,
  onReviewDeposit,
  onReviewWithdrawal,
}) {
  const byType = { investment: [], crypto: [], vehicle: [] };
  orders.forEach((o) => {
    (byType[o.type] = byType[o.type] || []).push(o);
  });
  const portfolioTotal = orders.reduce((s, o) => s + (Number(o.amount) || 0), 0);
  const typeLabels = { investment: 'Investments', crypto: 'Crypto', vehicle: 'Vehicles' };
  const sections = Object.keys(typeLabels).filter((k) => (byType[k] || []).length);

  const kyc = user.kycData || {};
  const kycName = [kyc.first_name, kyc.last_name].filter(Boolean).join(' ');
  const kycDoc = [kyc.document_type, kyc.document_number].filter(Boolean).join(' · ');
  const idImages = Array.isArray(user.idImages) ? user.idImages : [];

  const reviewActions = (kind, id) => (
    <div className="flex shrink-0 gap-1">
      <button
        type="button"
        onClick={() => (kind === 'deposit' ? onReviewDeposit(id, 'approved') : onReviewWithdrawal(id, 'approved'))}
        className="rounded-full bg-[#16a34a] px-2.5 py-0.5 text-[11px] font-medium text-white transition hover:bg-[#15803d]"
      >
        Approve
      </button>
      <button
        type="button"
        onClick={() => (kind === 'deposit' ? onReviewDeposit(id, 'rejected') : onReviewWithdrawal(id, 'rejected'))}
        className="rounded-full border border-gray-300 px-2.5 py-0.5 text-[11px] font-medium text-black transition hover:bg-gray-50 dark:border-white/20 dark:text-white dark:hover:bg-white/10"
      >
        Reject
      </button>
    </div>
  );

  const panelCls =
    'rounded-xl border border-slate-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-white/5';
  const h4Cls = 'text-sm font-medium text-black dark:text-white';

  return (
    <div className="glass-card p-4 sm:p-6">
      {/* User header */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-100 text-base font-medium text-slate-900 dark:bg-white/10 dark:text-white">
          {user.profileImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.profileImage} alt="" className="h-full w-full rounded-full object-cover" />
          ) : (
            (user.name || '?').charAt(0).toUpperCase()
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-medium text-black dark:text-white">{user.name}</h3>
          <p className="truncate text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs text-slate-500 dark:text-slate-400">Balance</p>
          <p className="text-lg font-medium text-success">${fmtMoney(user.balance)}</p>
        </div>
      </div>

      {/* Balance */}
      <div className={panelCls}>
        <div className="mb-2 flex items-center justify-between">
          <h4 className={h4Cls}>Set Balance</h4>
          <span className="text-xs text-slate-400">Joined {fmtDate(user.createdAt)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">$</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={user.balance ?? ''}
            onChange={(e) => onBalanceChange(e.target.value === '' ? '' : Number(e.target.value))}
            className={inputCls}
          />
          <button type="button" onClick={onSaveBalance} className={saveBtnCls}>
            Save
          </button>
        </div>
        {balanceMsg && (
          <p className={`mt-2 text-xs ${balanceMsg.includes('updated') ? 'text-success' : 'text-[#b91c1c]'}`}>
            {balanceMsg}
          </p>
        )}
      </div>

      {/* Dashboard Stats */}
      <div className={`mt-4 ${panelCls}`}>
        <h4 className={`mb-3 ${h4Cls}`}>Dashboard Stats</h4>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Total Profit</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={user.dashboardStats?.totalProfit ?? ''}
              onChange={(e) => onStatChange('totalProfit', e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
              Bonus / Rewards &amp; Promotions
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={user.dashboardStats?.bonus ?? ''}
              onChange={(e) => onStatChange('bonus', e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <button type="button" onClick={onSaveStats} className={saveBtnCls}>
            Save Stats
          </button>
          {userStatsMsg && (
            <p className={`text-xs ${userStatsMsg.includes('updated') ? 'text-success' : 'text-[#b91c1c]'}`}>
              {userStatsMsg}
            </p>
          )}
        </div>
      </div>

      {/* Portfolio */}
      <div className={`mt-4 ${panelCls}`}>
        <div className="mb-3 flex items-center justify-between">
          <h4 className={h4Cls}>Portfolio</h4>
          <div className="text-right">
            <p className="text-[11px] text-slate-400">Total invested</p>
            <p className="text-sm font-medium text-success">${fmtMoney(portfolioTotal)}</p>
          </div>
        </div>
        {sections.length ? (
          sections.map((k) => (
            <div key={k} className="mb-3 last:mb-0">
              <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-slate-400">{typeLabels[k]}</p>
              {byType[k].map((o) => (
                <div key={o.id} className="flex items-center justify-between py-1.5 last:pb-0">
                  <span className="min-w-0 truncate text-xs text-slate-500 dark:text-slate-400">{o.item}</span>
                  <span className="shrink-0 text-xs font-medium text-black dark:text-white">
                    ${fmtMoney(o.amount)}
                  </span>
                </div>
              ))}
            </div>
          ))
        ) : (
          <p className="py-2 text-xs text-slate-400">No investments or purchases yet.</p>
        )}
      </div>

      {/* Account Status */}
      <div className={`mt-4 ${panelCls}`}>
        <div className="mb-2 flex items-center justify-between">
          <h4 className={h4Cls}>Account Status</h4>
          {user.blocked && (
            <span className="rounded-full bg-[#fecaca] px-2 py-0.5 text-[10px] font-semibold text-[#b91c1c]">
              Blocked
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleBlock}
            className={
              user.blocked
                ? 'rounded-full bg-[#16a34a] px-5 py-2 text-xs font-medium text-white transition hover:bg-[#15803d]'
                : saveBtnCls
            }
          >
            {user.blocked ? 'Unblock User' : 'Block User'}
          </button>
        </div>
      </div>

      {/* Danger zone */}
      <div className="mt-4 flex flex-col gap-3 rounded-xl border border-[#fecaca] bg-[#fff5f5] p-4 sm:flex-row sm:items-center sm:justify-between dark:border-[#ef4444]/30 dark:bg-[#ef4444]/5">
        <div>
          <p className="text-sm font-medium text-[#b91c1c] dark:text-danger">Delete user account</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Removes the user, their sessions, deposits and orders.
          </p>
        </div>
        <button
          type="button"
          onClick={onDelete}
          className="shrink-0 rounded-full border border-[#fca5a5] px-5 py-2 text-center text-xs font-medium text-[#b91c1c] transition hover:bg-[#fef2f2] dark:border-[#ef4444]/40 dark:text-danger dark:hover:bg-[#ef4444]/10"
        >
          Delete User
        </button>
      </div>

      {/* Transactions */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <TxColumn
          title="Deposits"
          count={deposits.length}
          noun="deposit"
          onViewAll={() => onViewAll('deposits')}
        >
          {deposits.length ? (
            deposits.map((d) => (
              <div key={d.id} className="border-b border-gray-100 py-2 last:border-0 dark:border-white/5">
                <div className="flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate text-xs text-slate-500 dark:text-slate-400">
                    {fmtDate(d.createdAt)} · {String(d.coin).toUpperCase()}
                  </span>
                  <span className="shrink-0 text-xs font-medium text-black dark:text-white">
                    ${fmtMoney(d.amount)}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <StatusBadge status={d.status} />
                  {d.status === 'pending' && reviewActions('deposit', d.id)}
                </div>
              </div>
            ))
          ) : (
            <p className="py-2 text-xs text-slate-400">No deposits.</p>
          )}
        </TxColumn>

        <TxColumn
          title="Withdrawals"
          count={withdrawals.length}
          noun="withdrawal"
          onViewAll={() => onViewAll('withdrawals')}
        >
          {withdrawals.length ? (
            withdrawals.map((w) => (
              <div key={w.id} className="border-b border-gray-100 py-2 last:border-0 dark:border-white/5">
                <div className="flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate text-xs text-slate-500 dark:text-slate-400">
                    {fmtDate(w.createdAt)} · {String(w.coin).toUpperCase()}
                  </span>
                  <span className="shrink-0 text-xs font-medium text-black dark:text-white">
                    ${fmtMoney(w.amount)}
                  </span>
                </div>
                <div className="mt-1 truncate font-mono text-[10px] text-slate-400" title={w.address}>
                  {w.address}
                </div>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <StatusBadge status={w.status} />
                  {w.status === 'pending' && reviewActions('withdrawal', w.id)}
                </div>
              </div>
            ))
          ) : (
            <p className="py-2 text-xs text-slate-400">No withdrawals.</p>
          )}
        </TxColumn>

        <TxColumn title="Purchases" count={orders.length} noun="purchase" onViewAll={() => onViewAll('orders')}>
          {orders.length ? (
            orders.map((o) => (
              <div
                key={o.id}
                className="flex items-center justify-between border-b border-gray-100 py-1.5 last:border-0 dark:border-white/5"
              >
                <span className="min-w-0 truncate text-xs text-slate-500 dark:text-slate-400">
                  {fmtDate(o.createdAt)} · {o.item}
                </span>
                <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-black dark:text-white">
                  ${fmtMoney(o.amount)} <TypeBadge type={o.type} />
                </span>
              </div>
            ))
          ) : (
            <p className="py-2 text-xs text-slate-400">No purchases.</p>
          )}
        </TxColumn>
      </div>
    </div>
  );
}

function TxColumn({ title, count, noun, onViewAll, children }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-white/5">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-medium text-black dark:text-white">{title}</h4>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">
            {count} {count === 1 ? noun : `${noun}s`}
          </span>
          <button
            type="button"
            onClick={onViewAll}
            className="shrink-0 rounded-full bg-gray-200 px-3 py-1 text-[11px] font-medium text-slate-900 transition hover:bg-gray-300 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
          >
            View All
          </button>
        </div>
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

/* ---------------- all-transactions modal ---------------- */

function TxModal({ kind, user, deposits, withdrawals, orders, onClose, onReviewDeposit, onReviewWithdrawal }) {
  const labels = { deposits: 'Deposits', withdrawals: 'Withdrawals', orders: 'Purchases' };
  const list = kind === 'deposits' ? deposits : kind === 'withdrawals' ? withdrawals : orders;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-white/10">
          <div>
            <h3 className="text-base font-medium text-black dark:text-white">All {labels[kind]}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {user.name} — {user.email}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-slate-500 transition hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {!list.length && (
            <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              No {labels[kind].toLowerCase()} yet.
            </p>
          )}

          {kind === 'orders' &&
            list.map((o) => (
              <div
                key={o.id}
                className="flex items-center justify-between border-b border-gray-100 py-2.5 last:border-0 dark:border-white/5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-black dark:text-white">{o.item}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{fmtDate(o.createdAt)}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-medium text-black dark:text-white">${fmtMoney(o.amount)}</p>
                  <TypeBadge type={o.type} />
                </div>
              </div>
            ))}

          {kind !== 'orders' &&
            list.map((x) => (
              <div key={x.id} className="border-b border-gray-100 py-3 last:border-0 dark:border-white/5">
                <div className="flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate text-xs text-slate-500 dark:text-slate-400">
                    {fmtDate(x.createdAt)} · {String(x.coin).toUpperCase()}
                  </span>
                  <span className="shrink-0 text-sm font-medium text-black dark:text-white">
                    ${fmtMoney(x.amount)}
                  </span>
                </div>
                {kind === 'withdrawals' && (
                  <p className="mt-1 truncate font-mono text-[10px] text-slate-400" title={x.address}>
                    {x.address}
                  </p>
                )}
                <div className="mt-1.5 flex items-center gap-2">
                  <StatusBadge status={x.status} />
                  {x.status === 'pending' &&
                    (kind === 'withdrawals' ? (
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => onReviewWithdrawal(x.id, 'approved')}
                          className="rounded-full bg-[#16a34a] px-3 py-1 text-xs font-medium text-white transition hover:bg-[#15803d]"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => onReviewWithdrawal(x.id, 'rejected')}
                          className="rounded-full border border-gray-300 px-3 py-1 text-xs font-medium text-black transition hover:bg-gray-50 dark:border-white/20 dark:text-white dark:hover:bg-white/10"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => onReviewDeposit(x.id, 'approved')}
                          className="rounded-full bg-[#16a34a] px-3 py-1 text-xs font-medium text-white transition hover:bg-[#15803d]"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => onReviewDeposit(x.id, 'rejected')}
                          className="rounded-full border border-gray-300 px-3 py-1 text-xs font-medium text-black transition hover:bg-gray-50 dark:border-white/20 dark:text-white dark:hover:bg-white/10"
                        >
                          Reject
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
