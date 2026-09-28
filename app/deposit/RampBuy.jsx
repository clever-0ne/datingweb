'use client';

import { useEffect, useState } from 'react';
import { CreditCard, Copy, Check, X, ExternalLink, ClipboardPaste, UserCheck, Wallet, Clock } from 'lucide-react';

// Ramp asset codes for the coins we accept. Unknown ids just open Ramp without
// a preselected asset, so the user can still pick it there.
const RAMP_ASSETS = {
  btc: 'BTC_BTC',
  eth: 'ETH_ETH',
  usdt: 'ETH_USDT',
  usdt_trc20: 'TRON_USDT',
  usdt_erc20: 'ETH_USDT',
  usdc: 'ETH_USDC',
  ltc: 'LTC_LTC',
  sol: 'SOLANA_SOL',
  bnb: 'BSC_BNB',
  trx: 'TRON_TRX',
  doge: 'DOGE_DOGE',
};

function rampUrl(coinId) {
  const asset = RAMP_ASSETS[String(coinId || '').toLowerCase()];
  return asset ? `https://app.ramp.network/?swapAsset=${asset}` : 'https://app.ramp.network/';
}

export default function RampBuy({ coin, deposit }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  // 'copy' -> user copies address, 'return' -> they went to Ramp and come back to log the deposit, 'done' -> pending
  const [stage, setStage] = useState('copy');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  const show = () => {
    setCopied(false);
    setStage('copy');
    setAmount('');
    setError(null);
    setOpen(true);
  };

  const copy = () => {
    if (!coin?.address) return;
    const done = () => setCopied(true);
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(coin.address).then(done, () => fallbackCopy(coin.address, done));
    } else {
      fallbackCopy(coin.address, done);
    }
  };

  const buyNow = () => {
    window.open(rampUrl(coin?.id), '_blank', 'noopener,noreferrer');
    // Keep the pop-up open so when they come back to this tab they can log the deposit.
    setStage('return');
  };

  const submitPurchase = async (e) => {
    e.preventDefault();
    setError(null);
    if (!(Number(amount) >= 10)) {
      setError('Minimum deposit is $10.00');
      return;
    }
    setSubmitting(true);
    const d = await deposit(amount, coin.id);
    setSubmitting(false);
    if (d?.ok) setStage('done');
    else setError(d?.error || 'Something went wrong. Please try again.');
  };

  const label = coin?.name || String(coin?.id || 'crypto').toUpperCase();

  return (
    <>
      <div className="ramp-card panel mt-6">
        <div className="ramp-card-icon"><CreditCard size={22} /></div>
        <div className="ramp-card-body">
          <h2 className="text-base font-bold hi">No crypto? Buy it with your card</h2>
          <p className="text-sm mut">
            Purchase {label} with Visa, Mastercard, Apple Pay or bank transfer through Ramp, sent straight to your deposit address.
          </p>
        </div>
        <button type="button" className="btn btn-pri ramp-card-btn" onClick={show} disabled={!coin?.address}>
          <CreditCard size={16} /> Purchase with card
        </button>
      </div>

      {open && (
        <div className="ramp-overlay" onClick={() => setOpen(false)}>
          <div className="ramp-modal" role="dialog" aria-modal="true" aria-labelledby="ramp-title" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="ramp-close" onClick={() => setOpen(false)} aria-label="Close">
              <X size={18} />
            </button>

            <div className="ramp-modal-head">
              <div className="ramp-card-icon"><Wallet size={20} /></div>
              <div>
                <h3 id="ramp-title" className="text-lg font-bold hi">Copy your {label} address</h3>
                <p className="text-sm mut">You'll paste this into Ramp so the crypto lands in your account.</p>
              </div>
            </div>

            <div className="ramp-address">
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wide faint">
                  {label}{coin?.network ? ` · ${coin.network}` : ''}
                </p>
                <p className="ramp-address-value hi">{coin?.address}</p>
              </div>
              <button type="button" className={`btn ${copied ? 'btn-ghost' : 'btn-pri'} ramp-copy`} onClick={copy}>
                {copied ? <><Check size={16} /> Copied</> : <><Copy size={16} /> Copy address</>}
              </button>
            </div>

            <ol className="ramp-steps">
              <li><span>1</span> Select the amount you want to buy</li>
              <li><span><UserCheck size={13} /></span> Complete the quick identity check (KYC)</li>
              <li><span><ClipboardPaste size={13} /></span> Paste the address you just copied</li>
              <li><span><CreditCard size={13} /></span> Choose a payment method and pay</li>
            </ol>

            <p className="ramp-warn">
              Only send {label}{coin?.network ? ` on ${coin.network}` : ''} to this address. Other assets or networks may be lost.
            </p>

            {stage === 'copy' && (copied ? (
              <button type="button" className="btn btn-pri ramp-buy" onClick={buyNow}>
                Buy now on Ramp <ExternalLink size={16} />
              </button>
            ) : (
              <p className="ramp-hint">Copy the address to continue</p>
            ))}

            {stage === 'return' && (
              <form className="ramp-return" onSubmit={submitPurchase}>
                <p className="text-sm font-bold hi">Finished paying on Ramp?</p>
                <p className="text-xs mut">Enter the amount you bought so we can track your deposit.</p>
                <div className="ramp-amount">
                  <span>$</span>
                  <input
                    type="number" min="10" step="0.01" inputMode="decimal" placeholder="0.00"
                    value={amount} onChange={(e) => setAmount(e.target.value)} required
                  />
                </div>
                {error && <p className="ramp-error">{error}</p>}
                <button type="submit" className="btn btn-pri ramp-buy" disabled={submitting}>
                  {submitting ? 'Submitting…' : "I've completed my purchase"}
                </button>
                <button type="button" className="ramp-link" onClick={buyNow}>Reopen Ramp</button>
              </form>
            )}

            {stage === 'done' && (
              <div className="ramp-done">
                <div className="ramp-done-icon"><Clock size={22} /></div>
                <p className="text-base font-bold hi">Deposit pending</p>
                <p className="text-sm mut">
                  We've logged your ${Number(amount).toFixed(2)} {label} deposit. It'll show in your balance once an admin approves it.
                </p>
                <button type="button" className="btn btn-pri ramp-buy" onClick={() => setOpen(false)}>Done</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function fallbackCopy(text, done) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); } catch {}
  document.body.removeChild(ta);
  done();
}
