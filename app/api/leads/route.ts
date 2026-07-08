import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { loadAllRules } from "@/lib/rules/load";
import { buildLead, leadPayloadSchema, type Lead } from "@/lib/checker/lead";
import { todayInRome } from "@/lib/checker/format";
import { optionKeys } from "@/lib/checker/options";
import { buildCheckerReportEmail } from "@/lib/email/checker-report";
import { getResend, EMAIL_FROM } from "@/lib/email/resend";
import { t } from "@/lib/i18n";

/**
 * Email gate endpoint (ARCHITECTURE.md §6): validate → recompute result via
 * the engine → save lead → send report via Resend. Public and unauthenticated
 * (the leads table RLS allows anonymous INSERT only).
 *
 * No lead lost, ever: leads are the product's validation metric. Whenever a
 * lead does not land in the DB — env missing or insert error — the full
 * payload is logged at error level as recoverable JSON ("[lead-fallback]").
 * Email and analytics stay best-effort; only validation failures return 4xx.
 */

function logLeadFallback(lead: Lead, reason: string): void {
  console.error(
    "[lead-fallback]",
    JSON.stringify({ email: lead.email, answers: lead.answers, reason }),
  );
}

async function saveLead(lead: Lead): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    logLeadFallback(lead, "supabase env not configured");
    return;
  }
  // Bare anon client: no cookies/session needed, RLS enforced. The insert must
  // not chain .select() — the leads policy is INSERT-only, a returning clause
  // would make every insert fail.
  const supabase = createClient(url, anonKey, { auth: { persistSession: false } });
  const { error } = await supabase
    .from("leads")
    .insert({ email: lead.email, answers: lead.answers, result: lead.result });
  if (error) {
    logLeadFallback(lead, `supabase insert failed: ${error.message}`);
  }
}

async function sendReport(lead: Lead, notCoveredNames: string[]): Promise<void> {
  const email = buildCheckerReportEmail(lead.result, notCoveredNames, lead.answers.referenceDate);
  const resend = getResend();
  if (!resend) {
    console.info(
      "[leads] Resend not configured — report email:",
      JSON.stringify({
        to: lead.email,
        subject: email.subject,
        countries: lead.result.map((o) => o.countryCode),
      }),
    );
    return;
  }
  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: lead.email,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });
  if (error) {
    console.error("[leads] Resend send failed:", error.message);
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  const parsed = leadPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid payload" }, { status: 400 });
  }

  try {
    const loaded = loadAllRules();
    if (loaded.errors.length > 0) {
      console.error("[rules] failed to load:", loaded.errors);
    }
    const rules = loaded.ok.map(({ rule }) => rule);
    const lead = buildLead(parsed.data, rules, todayInRome());

    const coveredCodes = new Set(lead.result.map((o) => o.countryCode));
    const notCoveredNames = parsed.data.answers.selling
      .filter((code) => !coveredCodes.has(code))
      .map((code) => t(optionKeys.country(code)));

    // Each side effect contains its own failures: a thrown save still logs the
    // recoverable payload, and a thrown send never 500s an already-saved lead
    // (the client would retry and duplicate it).
    try {
      await saveLead(lead);
    } catch (err) {
      logLeadFallback(lead, `unexpected save failure: ${err instanceof Error ? err.message : String(err)}`);
    }
    try {
      await sendReport(lead, notCoveredNames);
    } catch (err) {
      console.error("[leads] unexpected send failure:", err);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[leads] unexpected failure:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
