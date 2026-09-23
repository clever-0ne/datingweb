import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  try {
    const { to, subject, html, template, data } = await req.json();

    if (!to || !subject || !html) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@podz.buzz',
      to,
      subject,
      html,
    });

    return Response.json({ success: true, id: result.id });
  } catch (error) {
    console.error('Email send error:', error);
    return Response.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
