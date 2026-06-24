import "server-only";
import { getEmailClient, getEmailFrom } from "./client";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<boolean> {
  const client = getEmailClient();
  if (!client) {
    console.warn("[Email] RESEND_API_KEY not set, skipping email:", subject);
    return false;
  }

  try {
    const { error } = await client.emails.send({
      from: getEmailFrom(),
      to,
      subject,
      html,
    });
    if (error) {
      console.error("[Email] Failed to send:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[Email] Error:", err);
    return false;
  }
}
