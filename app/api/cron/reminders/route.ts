import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadAllRules } from "@/lib/rules/load";
import { todayInRome } from "@/lib/checker/format";
import { buildDeadlineReminderEmail, type ReminderDeadline } from "@/lib/email/deadline-reminder";
import { getResend, EMAIL_FROM } from "@/lib/email/resend";
import { canReceiveReminders, normalizePlan } from "@/lib/plans";
import { t } from "@/lib/i18n";
import type { DeadlineRow } from "@/lib/app/types";

/**
 * Daily deadline-reminder cron (ARCHITECTURE.md §7): find open deadlines due in
 * 30 / 7 / 1 days, email the company owner via Resend, and stamp
 * `reminder_sent_at`. Guarded by CRON_SECRET (Vercel sends it as a Bearer
 * token). Uses the service-role client to read across companies.
 */
export const dynamic = "force-dynamic";

/** ISO date (YYYY-MM-DD) shifted by whole days, timezone-independent. */
function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function daysBetween(fromIso: string, toIso: string): number {
  const [fy, fm, fd] = fromIso.split("-").map(Number);
  const [ty, tm, td] = toIso.split("-").map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86_400_000);
}

export async function GET(request: Request): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: false, error: "CRON_SECRET not configured" }, { status: 500 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const today = todayInRome();
  const targets = [1, 7, 30].map((n) => addDaysIso(today, n));

  const supabase = createAdminClient();
  const { data: deadlineData, error } = await supabase
    .from("deadlines")
    .select("*")
    .eq("status", "open")
    .in("due_date", targets);
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  // Skip anything already reminded today (a single reminder_sent_at per row is
  // enough because the 30/7/1 windows fall on distinct days).
  const due = ((deadlineData ?? []) as DeadlineRow[]).filter(
    (d) => !d.reminder_sent_at || d.reminder_sent_at.slice(0, 10) !== today,
  );
  if (due.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, companies: 0 });
  }

  const rules = loadAllRules().ok.map(({ rule }) => rule);
  const ruleByCode = new Map(rules.map((r) => [r.country_code, r]));

  // Group by company.
  const byCompany = new Map<string, DeadlineRow[]>();
  for (const deadline of due) {
    const list = byCompany.get(deadline.company_id) ?? [];
    list.push(deadline);
    byCompany.set(deadline.company_id, list);
  }

  const { data: companiesData } = await supabase
    .from("companies")
    .select("id, owner_id, name, plan")
    .in("id", [...byCompany.keys()]);
  const companyById = new Map(
    (companiesData ?? []).map(
      (c: { id: string; owner_id: string; name: string; plan: string }) => [c.id, c],
    ),
  );

  const resend = getResend();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cockpitepr.app";
  let sentDeadlines = 0;
  let sentCompanies = 0;

  for (const [companyId, companyDeadlines] of byCompany) {
    const company = companyById.get(companyId);
    if (!company) continue;
    // Reminders are a paid feature (ARCHITECTURE §8): skip non-paying plans.
    if (!canReceiveReminders(normalizePlan(company.plan))) continue;

    const { data: userData } = await supabase.auth.admin.getUserById(company.owner_id);
    const email = userData?.user?.email;
    if (!email) continue;

    const items: ReminderDeadline[] = companyDeadlines.map((deadline) => {
      const rule = ruleByCode.get(deadline.country_code);
      return {
        countryName: rule?.country_name ?? t(`countries.${deadline.country_code}`),
        date: deadline.due_date,
        description: rule?.register.name ?? deadline.kind,
        daysUntil: daysBetween(today, deadline.due_date),
      };
    });

    const message = buildDeadlineReminderEmail(items, company.name, siteUrl);

    if (!resend) {
      // Dev / unconfigured: log and DO NOT stamp reminder_sent_at (dry run).
      console.info("[cron/reminders] Resend not configured — would send:", {
        to: email,
        subject: message.subject,
        deadlines: companyDeadlines.map((d) => `${d.country_code} ${d.due_date}`),
      });
      continue;
    }

    const { error: sendError } = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });
    if (sendError) {
      console.error("[cron/reminders] send failed:", sendError.message);
      continue;
    }

    await supabase
      .from("deadlines")
      .update({ reminder_sent_at: new Date().toISOString() })
      .in(
        "id",
        companyDeadlines.map((d) => d.id),
      );
    sentDeadlines += companyDeadlines.length;
    sentCompanies += 1;
  }

  return NextResponse.json({ ok: true, sent: sentDeadlines, companies: sentCompanies });
}
