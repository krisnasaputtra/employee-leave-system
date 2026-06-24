import "server-only";
import { Resend } from "resend";

let resendClient: Resend | null = null;

export function getEmailClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

export function getEmailFrom(): string {
  return process.env.EMAIL_FROM || "BNI Leave System <noreply@bni.co.id>";
}
