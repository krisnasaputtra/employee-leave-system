import "server-only";
import { Resend } from "resend";

import { getServerEnv } from "@/lib/server-env";

let resendClient: Resend | null = null;

export function getEmailClient(): Resend | null {
  const { RESEND_API_KEY } = getServerEnv();
  if (!RESEND_API_KEY) return null;
  if (!resendClient) {
    resendClient = new Resend(RESEND_API_KEY);
  }
  return resendClient;
}

export function getEmailFrom(): string {
  return getServerEnv().EMAIL_FROM;
}
