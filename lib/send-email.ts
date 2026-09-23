import { sendEmail } from './resend';

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(email: string, name: string) {
  return sendEmail({
    to: email,
    template: 'welcome',
    data: { name, email },
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string, name: string, resetLink: string) {
  return sendEmail({
    to: email,
    template: 'password-reset',
    data: { name, resetLink },
  });
}

/**
 * Send notification email
 */
export async function sendNotificationEmail(
  email: string,
  title: string,
  message: string,
  actionUrl?: string
) {
  return sendEmail({
    to: email,
    template: 'notification',
    data: { title, message, actionUrl },
  });
}

/**
 * Send authentication code email (for mining, investment, or login)
 */
export async function sendAuthCodeEmail(
  email: string,
  code: string,
  type: 'mining' | 'investment' | 'login' = 'login'
) {
  return sendEmail({
    to: email,
    template: 'auth-code',
    data: { code, type },
  });
}

/**
 * Send mining payout notification
 */
export async function sendMiningPayoutEmail(
  email: string,
  name: string,
  amount: number,
  transactionId: string
) {
  return sendNotificationEmail(
    email,
    'Mining Payout Received',
    `You have received a mining payout of $${amount.toFixed(2)}. Transaction ID: ${transactionId}`,
    `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/payouts/${transactionId}`
  );
}

/**
 * Send investment payout notification
 */
export async function sendInvestmentPayoutEmail(
  email: string,
  name: string,
  amount: number,
  transactionId: string
) {
  return sendNotificationEmail(
    email,
    'Investment Payout Received',
    `You have received an investment payout of $${amount.toFixed(2)}. Transaction ID: ${transactionId}`,
    `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/investments/${transactionId}`
  );
}
