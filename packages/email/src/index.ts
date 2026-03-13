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

import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

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
  if (!resend) {
    console.warn(`[Email] Skipped (no RESEND_API_KEY): "${subject}" → ${to}`);
    return { success: false, error: "No API key configured" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: from || process.env.EMAIL_FROM || "Berean Bible Academy <onboarding@resend.dev>",
      to,
      subject,
      html,
    });
    if (error) {
      console.error("Email send error:", error);
      return { success: false, error };
    }
    return { success: true, data };
  } catch (error) {
    console.error("Email send error:", error);
    return { success: false, error };
  }
}
