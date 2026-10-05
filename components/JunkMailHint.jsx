import { MailWarning } from 'lucide-react';

/**
 * Shown wherever the user has to fetch something from their email. Our mail
 * often lands in spam/junk on first contact, and a user who can't find it
 * just assumes it never came.
 */
export default function JunkMailHint({ className = '' }) {
  return (
    <p
      role="note"
      className={`flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 ${className}`}
    >
      <MailWarning size={14} className="mt-px shrink-0" aria-hidden="true" />
      <span>
        Can&apos;t see the email in your inbox? Check your <strong>junk</strong> or <strong>spam</strong> folder.
        It can take a minute to arrive.
      </span>
    </p>
  );
}
