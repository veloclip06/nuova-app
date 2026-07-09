import { formatDateIt } from "@/lib/checker/format";
import { t } from "@/lib/i18n";

/**
 * Deadline-reminder email (ARCHITECTURE.md §7). Pure builder — no I/O, no env,
 * email-safe inline styles with system fonts. Sent by the daily Vercel Cron at
 * 30/7/1 days before a deadline. Every value comes from the caller; nothing
 * normative is authored here (DESIGN_SYSTEM.md §8.13 — fixed legal disclaimer).
 */

const INK = "#17242f";
const MUTED = "#5a6b76";
const LINE = "#dee3e0";
const BRAND = "#0e6b5c";

export interface ReminderDeadline {
  countryName: string;
  /** ISO date (YYYY-MM-DD). */
  date: string;
  description: string;
  /** 30 | 7 | 1 — days until the deadline. */
  daysUntil: number;
}

export interface DeadlineReminderEmail {
  subject: string;
  html: string;
  text: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function whenLabel(daysUntil: number): string {
  if (daysUntil <= 1) return t("app.email.reminder.tomorrow");
  if (daysUntil === 7) return t("app.email.reminder.in7");
  return t("app.email.reminder.inDays", { days: daysUntil });
}

export function buildDeadlineReminderEmail(
  deadlines: ReminderDeadline[],
  companyName: string,
  siteUrl = "https://cockpitepr.app",
): DeadlineReminderEmail {
  const subject =
    deadlines.length === 1
      ? t("app.email.reminder.subjectOne")
      : t("app.email.reminder.subject", { count: deadlines.length });

  const rows = deadlines
    .map(
      (deadline) =>
        `<tr>` +
        `<td style="padding:8px 12px;border-bottom:1px solid ${LINE};font-family:monospace;font-size:13px;color:${INK};white-space:nowrap;">${escapeHtml(formatDateIt(deadline.date))}</td>` +
        `<td style="padding:8px 12px;border-bottom:1px solid ${LINE};font-size:14px;color:${INK};">${escapeHtml(deadline.countryName)} — ${escapeHtml(deadline.description)}</td>` +
        `<td style="padding:8px 12px;border-bottom:1px solid ${LINE};font-size:13px;color:${MUTED};white-space:nowrap;">${escapeHtml(whenLabel(deadline.daysUntil))}</td>` +
        `</tr>`,
    )
    .join("");

  const html = [
    `<div style="max-width:640px;margin:0 auto;padding:24px;font-family:Arial,Helvetica,sans-serif;background:#ffffff;">`,
    `<p style="margin:0 0 2px;color:${BRAND};font-size:12px;text-transform:uppercase;letter-spacing:0.08em;"><strong>${escapeHtml(t("common.appName"))}</strong></p>`,
    `<p style="margin:0 0 12px;color:${INK};font-size:14px;line-height:1.6;">${escapeHtml(t("app.email.reminder.intro", { company: companyName }))}</p>`,
    `<table style="width:100%;border-collapse:collapse;">${rows}</table>`,
    `<p style="margin:20px 0 0;"><a href="${escapeHtml(siteUrl)}/app" style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:14px;">${escapeHtml(t("app.email.reminder.cta"))}</a></p>`,
    `<p style="margin:16px 0 0;color:${INK};font-size:14px;">${escapeHtml(t("app.email.reminder.outro"))}</p>`,
    `<p style="margin:24px 0 0;padding-top:16px;border-top:1px solid ${LINE};color:${MUTED};font-size:12px;line-height:1.5;">${escapeHtml(t("common.legalDisclaimer"))}</p>`,
    `</div>`,
  ].join("\n");

  const text = [
    t("common.appName"),
    t("app.email.reminder.intro", { company: companyName }),
    "",
    ...deadlines.map(
      (deadline) =>
        `- ${formatDateIt(deadline.date)} · ${deadline.countryName} — ${deadline.description} (${whenLabel(deadline.daysUntil)})`,
    ),
    "",
    t("app.email.reminder.outro"),
    `${siteUrl}/app`,
    "",
    t("common.legalDisclaimer"),
  ].join("\n");

  return { subject, html, text };
}
