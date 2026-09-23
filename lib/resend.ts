import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY);

export type EmailTemplate =
  | 'welcome'
  | 'password-reset'
  | 'notification'
  | 'auth-code';

interface SendEmailProps {
  to: string;
  template: EmailTemplate;
  data: Record<string, any>;
}

export async function sendEmail({ to, template, data }: SendEmailProps) {
  try {
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@example.com',
      to,
      subject: getEmailSubject(template),
      html: getEmailTemplate(template, data),
    });

    return result;
  } catch (error) {
    console.error(`Failed to send ${template} email:`, error);
    throw error;
  }
}

function getEmailSubject(template: EmailTemplate): string {
  const subjects: Record<EmailTemplate, string> = {
    'welcome': 'Welcome to Our Platform',
    'password-reset': 'Reset Your Password',
    'notification': 'Important Notification',
    'auth-code': 'Your Authentication Code',
  };
  return subjects[template];
}

function getEmailTemplate(template: EmailTemplate, data: Record<string, any>): string {
  switch (template) {
    case 'welcome':
      return welcomeTemplate(data);
    case 'password-reset':
      return passwordResetTemplate(data);
    case 'notification':
      return notificationTemplate(data);
    case 'auth-code':
      return authCodeTemplate(data);
    default:
      return '';
  }
}

function welcomeTemplate(data: { name: string; email: string }): string {
  return `
    <html>
      <body style="font-family: Arial, sans-serif;">
        <h1>Welcome, ${data.name}!</h1>
        <p>Thank you for joining our platform. We're excited to have you on board.</p>
        <p>Your account has been successfully created with the email: ${data.email}</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Get Started</a></p>
        <p>If you have any questions, feel free to contact our support team.</p>
      </body>
    </html>
  `;
}

function passwordResetTemplate(data: { name: string; resetLink: string }): string {
  return `
    <html>
      <body style="font-family: Arial, sans-serif;">
        <h1>Password Reset Request</h1>
        <p>Hi ${data.name},</p>
        <p>We received a request to reset your password. Click the link below to set a new password:</p>
        <p><a href="${data.resetLink}" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
        <p>This link expires in 24 hours.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </body>
    </html>
  `;
}

function notificationTemplate(data: { title: string; message: string; actionUrl?: string }): string {
  return `
    <html>
      <body style="font-family: Arial, sans-serif;">
        <h1>${data.title}</h1>
        <p>${data.message}</p>
        ${data.actionUrl ? `<p><a href="${data.actionUrl}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View More</a></p>` : ''}
      </body>
    </html>
  `;
}

function authCodeTemplate(data: { code: string; type: 'mining' | 'investment' | 'login' }): string {
  const typeLabel = {
    'mining': 'Mining',
    'investment': 'Investment',
    'login': 'Login',
  }[data.type];

  return `
    <html>
      <body style="font-family: Arial, sans-serif;">
        <h1>${typeLabel} Authentication Code</h1>
        <p>Your ${typeLabel} authentication code is:</p>
        <div style="background-color: #f0f0f0; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h2 style="text-align: center; letter-spacing: 5px; font-size: 32px; color: #007bff;">${data.code}</h2>
        </div>
        <p>This code expires in 10 minutes. Do not share this code with anyone.</p>
        <p>If you didn't request this code, please ignore this email and contact support.</p>
      </body>
    </html>
  `;
}
