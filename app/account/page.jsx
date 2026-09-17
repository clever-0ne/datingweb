'use client';

import { useRef, useState } from 'react';
import { LogOut, Camera, ShieldCheck, Bell, TrendingUp, Mail, Copy, BellRing } from 'lucide-react';
import { useWallet, fmtMoney } from '@/lib/wallet';
import { usePush } from '@/lib/usePush';
import { PasskeyManager } from '@/components/PasskeyPanel';

function Toggle({ on = false, onChange, disabled = false }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className="relative h-6 w-11 rounded-full transition disabled:cursor-not-allowed disabled:opacity-50"
      style={{ background: on ? 'var(--primary)' : 'rgba(148,163,184,.25)' }}
    >
      <span
        className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all"
        style={{ left: on ? '1.4rem' : '0.125rem' }}
      />
    </button>
  );
}

function resizeImage(file, size) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const min = Math.min(img.width, img.height);
        ctx.drawImage(img, (img.width - min) / 2, (img.height - min) / 2, min, min, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function AccountPage() {
  const { balance, user, referralCode, refresh } = useWallet();
  const [nPayout, setNPayout] = useState(true);
  const [nMarket, setNMarket] = useState(true);
  const [nWeekly, setNWeekly] = useState(false);
  // Push is a per-device setting backed by the browser's push service, not a
  // local preference — the toggle reflects what this device is actually
  // registered for.
  const push = usePush();

  const fileRef = useRef(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const onPhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPhotoBusy(true);
    try {
      const image = await resizeImage(file, 160);
      const r = await fetch('/api/account/photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image }),
      });
      const d = await r.json();
      if (d.ok) await refresh();
    } catch (err) {
      /* ignore upload errors */
    }
    setPhotoBusy(false);
  };

  return (
    <>
      {/* Hero */}
      <div className="panel relative mb-6 p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
            <div className="h-[78px] w-[78px] shrink-0 overflow-hidden rounded-full border-2" style={{ borderColor: 'rgba(255,255,255,.25)' }}>
              <img src={user?.profileImage || '/assets/avatar.svg'} alt="Profile" className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-slate-400">Tesla Capital</p>
              <h1 className="mb-1 truncate text-2xl font-semibold text-white">Hi, {user?.name || 'there'}</h1>
              <p className="truncate text-sm mut">{user?.email || ''}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="pill pill-sec"><span className="mr-1 h-1.5 w-1.5 rounded-full" style={{ background: '#6ee7b7' }} /> Identity Verified</span>
          </div>
        </div>
      </div>

      {/* Profile + account details */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="panel p-5 sm:p-6 lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Personal Information</h3>
              <p className="text-xs mut">Manage your profile details</p>
            </div>
            <button onClick={() => fileRef.current?.click()} className="rounded-full border px-3.5 py-1.5 text-xs font-semibold text-white" style={{ borderColor: 'rgba(148,163,184,.3)' }}>
              <Camera size={14} className="mr-1 inline" /> {photoBusy ? 'Uploading…' : 'Change photo'}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPhoto} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Label label="Full name"><input className="inp" readOnly defaultValue={user?.name || ''} /></Label>
            <Label label="Email address"><input className="inp" readOnly defaultValue={user?.email || ''} /></Label>
            <Label label="Phone number"><input className="inp" readOnly defaultValue={user?.phone || ''} /></Label>
            <Label label="Address"><input className="inp" readOnly defaultValue={user?.address || ''} /></Label>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button className="btn btn-pri">Save changes</button>
            <button className="btn btn-ghost">Discard</button>
          </div>
        </div>

        <div className="panel p-5 sm:p-6">
          <h3 className="mb-1 text-lg font-semibold text-white">Account</h3>
          <p className="mb-4 text-xs mut">Membership &amp; identifiers</p>
          <dl className="space-y-3.5 text-sm">
            <Dd k="Account ID" v={user?.id || '—'} mono />
            <Dd k="Member since" v={user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'} />
            <div className="flex items-center justify-between border-t pt-3.5" style={{ borderColor: 'rgba(148,163,184,.12)' }}>
              <dt className="mut">Referral code</dt>
              <dd><button className="rounded-full px-2.5 py-1 font-mono text-xs font-bold text-white" style={{ background: 'rgba(148,163,184,.14)' }}>{referralCode} <Copy size={12} className="inline" /></button></dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Security + 2FA */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="panel p-5 sm:p-6">
          <h3 className="mb-1 text-lg font-semibold text-white">Security</h3>
          <p className="mb-5 text-xs mut">Update your password</p>
          <div className="space-y-4">
            <Label label="Current password"><input type="password" placeholder="••••••••••" className="inp" /></Label>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Label label="New password"><input type="password" placeholder="••••••••••" className="inp" /></Label>
              <Label label="Confirm new password"><input type="password" placeholder="••••••••••" className="inp" /></Label>
            </div>
            <button className="btn btn-pri">Update password</button>
          </div>
        </div>

        <div className="panel p-5 sm:p-6">
          <h3 className="mb-1 text-lg font-semibold text-white">Passkeys</h3>
          <p className="mb-5 text-xs mut">
            Sign in with your fingerprint, face or screen lock instead of a password
          </p>
          <PasskeyManager />
        </div>
      </div>

      {/* Notifications */}
      <div className="panel p-5 sm:p-6">
        <h3 className="mb-1 text-lg font-semibold text-white">Notifications</h3>
        <p className="mb-4 text-xs mut">Choose what we send you</p>
        <div className="divide-y" style={{ borderColor: 'rgba(148,163,184,.1)' }}>
          <SettingRow icon={Bell} title="Payout & deposit updates" sub="When money moves on your account"><Toggle on={nPayout} onChange={setNPayout} /></SettingRow>
          <SettingRow icon={TrendingUp} title="Market movers" sub="Significant crypto & stock changes"><Toggle on={nMarket} onChange={setNMarket} /></SettingRow>
          <SettingRow icon={Mail} title="Weekly email summary" sub="A digest of your portfolio every Monday"><Toggle on={nWeekly} onChange={setNWeekly} /></SettingRow>

          {push.available && (
            <SettingRow
              icon={BellRing}
              title="Push notifications on this device"
              sub={
                push.busy
                  ? 'Working…'
                  : push.subscribed
                    ? 'Alerts arrive even when the app is closed'
                    : 'Get alerts on this device when the app is closed'
              }
            >
              <Toggle
                on={push.subscribed}
                disabled={push.busy}
                onChange={() => (push.subscribed ? push.unsubscribe() : push.subscribe())}
              />
            </SettingRow>
          )}
        </div>

        {push.available && push.error && (
          <p className="mt-3 text-xs" style={{ color: '#fca5a5' }}>{push.error}</p>
        )}
        {!push.supported && (
          <p className="mt-3 text-xs mut">
            This browser does not support push notifications. On iPhone, add the site to your Home Screen first.
          </p>
        )}
        {push.supported && !push.configured && (
          <p className="mt-3 text-xs mut">
            Push is not configured on the server yet — set the VAPID keys to enable it.
          </p>
        )}
      </div>
    </>
  );
}

function Stat({ label, value, note, noteCls }) {
  return (
    <div className="card">
      <p className="mb-1 text-xs mut">{label}</p>
      <p className="text-lg font-semibold text-white">{value}</p>
      <p className={`text-xs font-medium ${noteCls}`}>{note}</p>
    </div>
  );
}

function Label({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium mut">{label}</span>
      {children}
    </label>
  );
}

function Dd({ k, v, mono, green }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="mut">{k}</dt>
      <dd className={`${mono ? 'font-mono text-xs' : 'text-sm'} font-semibold ${green ? 'grn' : 'text-white'}`}>{v}</dd>
    </div>
  );
}

function SettingRow({ icon: Icon, title, sub, children }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <span className="chip chip-b h-9 w-9 rounded-lg"><Icon size={16} /></span>
        <div>
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="text-xs mut">{sub}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
