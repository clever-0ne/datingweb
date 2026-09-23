import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@podz.buzz';
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://podz.buzz';

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(email, name) {
  try {
    const html = `
      <html>
        <body style="font-family: Arial, sans-serif;">
          <h1>Welcome to Podz Capital, ${name}!</h1>
          <p>Your account has been successfully created.</p>
          <p>You can now:</p>
          <ul>
            <li>Deposit crypto and earn returns</li>
            <li>Participate in mining</li>
            <li>Invest in plans</li>
            <li>Withdraw your earnings</li>
          </ul>
          <p><a href="${appUrl}/dashboard" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to Dashboard</a></p>
          <p>If you have questions, contact support@podz.buzz</p>
        </body>
      </html>
    `;

    const result = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Welcome to Podz Capital!',
      html,
    });

    return { success: true, id: result.id };
  } catch (error) {
    console.error('Welcome email error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send deposit approved notification
 */
export async function sendDepositApprovedEmail(email, name, amount, transactionId) {
  try {
    const html = `
      <html>
        <body style="font-family: Arial, sans-serif;">
          <h1>Deposit Approved! ✅</h1>
          <p>Hi ${name},</p>
          <p>Your deposit of <strong>$${amount.toFixed(2)}</strong> has been approved and added to your account.</p>
          <p>Transaction ID: ${transactionId}</p>
          <p>You can now:</p>
          <ul>
            <li>Start earning returns</li>
            <li>Invest in plans</li>
            <li>Participate in mining</li>
          </ul>
          <p><a href="${appUrl}/dashboard" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Account</a></p>
        </body>
      </html>
    `;

    const result = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Your Deposit Has Been Approved',
      html,
    });

    return { success: true, id: result.id };
  } catch (error) {
    console.error('Deposit approved email error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send deposit rejected notification
 */
export async function sendDepositRejectedEmail(email, name, amount, reason) {
  try {
    const html = `
      <html>
        <body style="font-family: Arial, sans-serif;">
          <h1>Deposit Status Update</h1>
          <p>Hi ${name},</p>
          <p>Your deposit of <strong>$${amount.toFixed(2)}</strong> has been rejected.</p>
          <p><strong>Reason:</strong> ${reason || 'Admin review'}</p>
          <p>The funds will be returned to your wallet shortly.</p>
          <p>If you have questions, contact support@podz.buzz</p>
        </body>
      </html>
    `;

    const result = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Deposit Rejected',
      html,
    });

    return { success: true, id: result.id };
  } catch (error) {
    console.error('Deposit rejected email error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send withdrawal processed notification
 */
export async function sendWithdrawalProcessedEmail(email, name, amount, transactionId, method) {
  try {
    const html = `
      <html>
        <body style="font-family: Arial, sans-serif;">
          <h1>Withdrawal Processed ✅</h1>
          <p>Hi ${name},</p>
          <p>Your withdrawal of <strong>$${amount.toFixed(2)}</strong> has been processed.</p>
          <p>Method: ${method}</p>
          <p>Transaction ID: ${transactionId}</p>
          <p>The funds should arrive in your account within 1-3 business days.</p>
          <p><a href="${appUrl}/dashboard" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Account</a></p>
        </body>
      </html>
    `;

    const result = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Your Withdrawal Has Been Processed',
      html,
    });

    return { success: true, id: result.id };
  } catch (error) {
    console.error('Withdrawal processed email error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send 2FA code
 */
export async function send2FACodeEmail(email, code, type = 'login') {
  try {
    const typeLabel = type === 'mining' ? 'Mining' : type === 'investment' ? 'Investment' : 'Login';

    const html = `
      <html>
        <body style="font-family: Arial, sans-serif;">
          <h1>${typeLabel} Authentication Code</h1>
          <p>Your ${typeLabel} authentication code is:</p>
          <div style="background-color: #f0f0f0; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h2 style="text-align: center; letter-spacing: 5px; font-size: 32px; color: #007bff;">${code}</h2>
          </div>
          <p>This code expires in 10 minutes. Do not share this code with anyone.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </body>
      </html>
    `;

    const result = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: `${typeLabel} Verification Code`,
      html,
    });

    return { success: true, id: result.id };
  } catch (error) {
    console.error('2FA email error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email, resetLink) {
  try {
    const html = `
      <html>
        <body style="font-family: Arial, sans-serif;">
          <h1>Password Reset Request</h1>
          <p>We received a request to reset your password. Click the link below:</p>
          <p><a href="${resetLink}" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
          <p>This link expires in 24 hours.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </body>
      </html>
    `;

    const result = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Password Reset Request',
      html,
    });

    return { success: true, id: result.id };
  } catch (error) {
    console.error('Password reset email error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send payout notification
 */
export async function sendPayoutNotificationEmail(email, name, amount, type, transactionId) {
  try {
    const typeLabel = type === 'mining' ? 'Mining Payout' : 'Investment Payout';

    const html = `
      <html>
        <body style="font-family: Arial, sans-serif;">
          <h1>${typeLabel} Received ✅</h1>
          <p>Hi ${name},</p>
          <p>You have received a ${typeLabel} of <strong>$${amount.toFixed(2)}</strong></p>
          <p>Transaction ID: ${transactionId}</p>
          <p>The funds have been added to your account balance.</p>
          <p><a href="${appUrl}/dashboard" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Account</a></p>
        </body>
      </html>
    `;

    const result = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: `${typeLabel} Received`,
      html,
    });

    return { success: true, id: result.id };
  } catch (error) {
    console.error('Payout notification email error:', error);
    return { success: false, error: error.message };
  }
}
