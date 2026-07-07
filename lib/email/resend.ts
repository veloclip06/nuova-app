import "server-only";
import { Resend } from "resend";

/**
 * Resend client for transactional email + deadline reminders (ARCHITECTURE.md
 * §7). Server-only. Returns null when no API key is set so dev runs don't fail.
 */
let cached: Resend | null | undefined;

export function getResend(): Resend | null {
  if (cached !== undefined) return cached;
  const key = process.env.RESEND_API_KEY;
  cached = key ? new Resend(key) : null;
  return cached;
}

/** Default From address (verified domain in Resend). */
export const EMAIL_FROM =
  process.env.RESEND_FROM ?? "Cockpit EPR <no-reply@example.com>";
