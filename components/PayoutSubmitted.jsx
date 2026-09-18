'use client';

import { Bell, CheckCircle2, ShieldCheck, X } from 'lucide-react';
import { fmtMoney } from '@/lib/wallet';

/**
 * The write-up shown after a payout request is submitted.
 *
 * A request is not a payout. It sits with an admin until they approve it, and
 * the six-digit code that releases the money is generated at that moment and
 * only ever surfaces in the user's notifications. So the confirmation has to do
 * more than say "submitted" — it has to send the reader to the bell, or an
 * approved request sits unclaimed because nobody said where the code goes.
 *
 * Shared by mining and investments: the two flows are one mechanism, differing
 * only in what the items are called.
 */
export default function PayoutSubmitted({ request, itemLabel = 'contract', onDismiss }) {
  const count = request?.itemIds?.length ?? 0;
  const fee = Number(request?.fee) || 0;
  const gross = Number(request?.gross) || 0;

  return (
    <section
      className="mb-6 overflow-hidden rounded-2xl"
      style={{ background: 'var(--ok-bg)', border: '1px solid var(--ok-bg)' }}
    >
      <header className="flex items-start gap-3 p-5">
        <span
          className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full"
          style={{ background: 'var(--ok-bg)' }}
        >
          <CheckCircle2 size={18} className="grn" />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-semibold hi">Withdrawal request submitted</h2>
          <p className="mt-0.5 text-xs mut">
            <span className="font-mono mut">{request?.id}</span>
            {count > 0 && (
              <> · {count} {itemLabel}{count === 1 ? '' : 's'}</>
            )}
            {gross > 0 && <> · {fmtMoney(gross)} gross</>}
          </p>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="ml-auto shrink-0 mut transition hover-tx"
          >
            <X size={16} />
          </button>
        )}
      </header>

      <div className="px-5 pb-5">
        <p className="text-xs leading-relaxed mut">
          Your request is with an administrator now, and{' '}
          <span className="font-medium hi">no money has moved yet</span> — the returns stay on
          the {itemLabel}s until you complete the last step below.
        </p>

        <ol className="mt-4 space-y-3">
          <li className="flex gap-3">
            <Step n={1} />
            <p className="text-xs leading-relaxed mut">
              <span className="font-medium hi">An administrator reviews it.</span> Approval is
              what releases your code, so this step is a person, not a timer.
            </p>
          </li>
          <li className="flex gap-3">
            <Step n={2} />
            <p className="text-xs leading-relaxed">
              <span className="font-medium hi">Check your notifications for the code.</span>{' '}
              <span className="mut">
                The moment it is approved, a six-digit verification code arrives behind the{' '}
                <Bell size={12} className="-mt-0.5 inline" aria-hidden="true" /> bell in the top bar.
                It is never shown on this page and never sent by email — so watch for it there. A
                quiet bell means the request is still waiting.
              </span>
            </p>
          </li>
          <li className="flex gap-3">
            <Step n={3} />
            <p className="text-xs leading-relaxed mut">
              <span className="font-medium hi">Enter the code on the payout card below.</span>{' '}
              Once approved it switches to <span className="hi">Enter your code</span>, and
              submitting it credits the full {gross > 0 ? fmtMoney(gross) : 'gross'} to your main
              balance.
            </p>
          </li>
        </ol>

        {fee > 0 && (
          <p
            className="mt-4 border-t pt-3 text-xs leading-relaxed mut"
            style={{ borderColor: 'var(--ok-bg)' }}
          >
            <ShieldCheck size={12} className="-mt-0.5 mr-1 inline blut" aria-hidden="true" />
            The {fmtMoney(fee)} gas fee was already charged against your balance. It is charged once,
            on submission, and refunded in full if the request is declined — at which point the{' '}
            {itemLabel}s become withdrawable again.
          </p>
        )}
      </div>
    </section>
  );
}

function Step({ n }) {
  return (
    <span
      className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-semibold"
      style={{ background: 'var(--ok-bg)', color: 'var(--ok-text)' }}
    >
      {n}
    </span>
  );
}
