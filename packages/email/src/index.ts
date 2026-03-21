export { lmsTemplates } from "./lms-templates";
export { sendLmsEmail } from "./lms-email";
export {
  notifyApplicationReceived,
  notifyApplicationAccepted,
  notifyApplicationRejected,
  notifyGradeReleased,
  notifyPaymentConfirmed,
  notifyCertificateIssued,
} from "./lms-triggers";

import nodemailer from "nodemailer";

// Create transporter based on available config
function getTransporter() {
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (smtpHost && smtpUser && smtpPass) {
    return nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  }

  // Gmail shortcut — just set GMAIL_USER and GMAIL_APP_PASSWORD
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (gmailUser && gmailPass) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    });
  }

  return null;
}

export async function sendEmail({
  to,
  subject,
  html,
  from,
}: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}) {
  const transporter = getTransporter();

  if (!transporter) {
    console.warn(`[Email] Skipped (no SMTP/Gmail config): "${subject}" → ${to}`);
    console.warn("[Email] Set GMAIL_USER + GMAIL_APP_PASSWORD or SMTP_HOST + SMTP_USER + SMTP_PASS");
    return { success: false, error: "No email provider configured" };
  }

  const sender = from
    || process.env.EMAIL_FROM
    || process.env.GMAIL_USER
    || process.env.SMTP_USER
    || "noreply@bba.org.ng";

  try {
    const info = await transporter.sendMail({
      from: sender.includes("<") ? sender : `Berean Bible Academy <${sender}>`,
      to,
      subject,
      html,
    });

    console.log(`[Email] Sent: "${subject}" → ${to} (${info.messageId})`);
    return { success: true, data: { messageId: info.messageId } };
  } catch (error) {
    console.error("[Email] Send error:", error);
    return { success: false, error };
  }
}
