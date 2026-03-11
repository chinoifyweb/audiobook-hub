import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!resend) {
    console.warn(`[Email] Skipped (no RESEND_API_KEY): "${subject}" → ${to}`);
    return { success: false, error: 'No API key configured' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'AudioBook Hub <onboarding@resend.dev>',
      to,
      subject,
      html,
    });
    if (error) {
      console.error('Email send error:', error);
      return { success: false, error };
    }
    return { success: true, data };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error };
  }
}
