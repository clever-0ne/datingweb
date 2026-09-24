import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const fromEmail = process.env.RESEND_FROM_EMAIL || 'tesla capital noreply@podz.buzz';
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://podz.buzz';

// Branded email template with black background, blue button, Tesla red logo
const emailTemplate = (title, content, buttonText = null, buttonLink = null) => `
  <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #000; }
        .container { max-width: 600px; margin: 0 auto; background-color: #0a0a0a; }
        .header { background: linear-gradient(135deg, #000 0%, #1a1a1a 100%); padding: 40px 20px; text-align: center; border-bottom: 2px solid #cc0000; }
        .logo { font-size: 48px; font-weight: bold; color: #cc0000; letter-spacing: 8px; margin: 0; }
        .logo-sub { font-size: 12px; color: #999; letter-spacing: 2px; margin-top: 5px; }
        .content { padding: 40px 20px; color: #e0e0e0; line-height: 1.6; }
        .content h1 { color: #ffffff; font-size: 28px; margin: 0 0 20px 0; }
        .content h2 { color: #ffffff; font-size: 20px; margin: 20px 0 15px 0; }
        .content p { margin: 15px 0; color: #d0d0d0; }
        .content ul { margin: 15px 0; padding-left: 20px; color: #d0d0d0; }
        .content li { margin: 8px 0; }
        .code-box { background-color: #1a1a1a; padding: 25px; border-radius: 8px; margin: 25px 0; border: 1px solid #333; text-align: center; }
        .code-display { font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #0066ff; font-family: 'Courier New', monospace; }
        .code-label { color: #999; font-size: 12px; margin-top: 10px; }
        .button { display: inline-block; padding: 12px 30px; background-color: #0066ff; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; transition: background-color 0.3s; }
        .button:hover { background-color: #0052cc; }
        .footer { background-color: #0a0a0a; padding: 30px 20px; text-align: center; border-top: 1px solid #333; color: #666; font-size: 12px; }
        .accent { color: #0066ff; }
        .warning { color: #ff9500; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">T</div>
          <div class="logo-sub">TESLA CAPITAL</div>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p style="margin: 0; color: #666;">© 2026 Tesla Capital. All rights reserved.</p>
          <p style="margin: 10px 0 0 0; color: #555;">If you have questions, contact support@podz.buzz</p>
        </div>
      </div>
    </body>
  </html>
`;

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(email, name) {
  try {
    const html = emailTemplate(
      'Welcome',
      `
        <h1>Welcome to Tesla Capital, ${name}!</h1>
        <p>Your account has been successfully created.</p>
        <p>You can now:</p>
        <ul>
          <li>Deposit crypto and earn returns</li>
          <li>Participate in mining</li>
          <li>Invest in plans</li>
          <li>Withdraw your earnings</li>
        </ul>
        <p><a href="${appUrl}/dashboard" class="button">Go to Dashboard</a></p>
      `
    );

    const result = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Welcome to Tesla Capital!',
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
    const html = emailTemplate(
      'Deposit Approved',
      `
        <h1>Deposit Approved ✅</h1>
        <p>Hi ${name},</p>
        <p>Your deposit of <span class="accent"><strong>$${amount.toFixed(2)}</strong></span> has been approved and added to your account.</p>
        <p>Transaction ID: <strong>${transactionId}</strong></p>
        <p>You can now:</p>
        <ul>
          <li>Start earning returns</li>
          <li>Invest in plans</li>
          <li>Participate in mining</li>
        </ul>
        <p><a href="${appUrl}/dashboard" class="button">View Account</a></p>
      `
    );

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
    const html = emailTemplate(
      'Deposit Status Update',
      `
        <h1>Deposit Status Update</h1>
        <p>Hi ${name},</p>
        <p>Your deposit of <span class="accent"><strong>$${amount.toFixed(2)}</strong></span> has been rejected.</p>
        <p><strong>Reason:</strong> <span class="warning">${reason || 'Admin review'}</span></p>
        <p>The funds will be returned to your wallet shortly.</p>
      `
    );

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
    const html = emailTemplate(
      'Withdrawal Processed',
      `
        <h1>Withdrawal Processed ✅</h1>
        <p>Hi ${name},</p>
        <p>Your withdrawal of <span class="accent"><strong>$${amount.toFixed(2)}</strong></span> has been processed.</p>
        <p><strong>Method:</strong> ${method}</p>
        <p><strong>Transaction ID:</strong> ${transactionId}</p>
        <p>The funds should arrive in your account within 1-3 business days.</p>
        <p><a href="${appUrl}/dashboard" class="button">View Account</a></p>
      `
    );

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

    const html = emailTemplate(
      `${typeLabel} Verification Code`,
      `
        <h1>${typeLabel} Authentication Code</h1>
        <p>Your ${typeLabel} verification code is:</p>
        <div class="code-box">
          <div class="code-display">${code}</div>
          <div class="code-label">Valid for 10 minutes</div>
        </div>
        <p><span class="warning">⚠️ Do not share this code with anyone.</span></p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    );

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
    const html = emailTemplate(
      'Password Reset Request',
      `
        <h1>Password Reset Request</h1>
        <p>We received a request to reset your password.</p>
        <p><a href="${resetLink}" class="button">Reset Password</a></p>
        <p style="color: #999; font-size: 12px;">This link expires in 24 hours. If you didn't request this, please ignore this email.</p>
      `
    );

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
 * Send payout notification with code
 */
export async function sendPayoutNotificationEmail(email, name, amount, type, transactionId, code = null) {
  try {
    const typeLabel = type === 'mining' ? 'Mining Payout' : 'Investment Payout';

    let codeSection = '';
    if (code) {
      codeSection = `
        <h2>Withdrawal Code Required</h2>
        <p>To withdraw this payout, you'll need to enter the following code:</p>
        <div class="code-box">
          <div class="code-display">${code}</div>
          <div class="code-label">Keep this code safe</div>
        </div>
        <p><a href="${appUrl}/dashboard" class="button">Withdraw Now</a></p>
      `;
    }

    const html = emailTemplate(
      `${typeLabel} Received`,
      `
        <h1>${typeLabel} Received ✅</h1>
        <p>Hi ${name},</p>
        <p>You have received a ${typeLabel} of <span class="accent"><strong>$${amount.toFixed(2)}</strong></span></p>
        <p><strong>Transaction ID:</strong> ${transactionId}</p>
        <p>The funds have been added to your account balance.</p>
        ${codeSection}
        <p style="color: #999; font-size: 12px;">If you have questions, contact support@podz.buzz</p>
      `
    );

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
