import "server-only";
import { createClient } from "@/lib/supabase/server";
import { generateDeadlines } from "@/lib/engine/generate-deadlines";
import { loadAllRules } from "@/lib/rules/load";
import { todayInRome } from "@/lib/checker/format";
import { toCompanyProfile } from "./mappers";
import { reconcileDeadlines, toDesiredDeadlines } from "./deadlines-sync";
import type { CompanyCountryRow, CompanyRow, DeadlineRow } from "./types";

/**
 * Recompute the company's dated deadlines with the engine and persist them to
 * the `deadlines` table (ARCHITECTURE.md §7), preserving the status and
 * reminder state of unchanged rows. Call after onboarding and after any
 * per-country status change. Best-effort: a failure here never blocks the user
 * action that triggered it (the dashboard recomputes deadlines live anyway).
 */
export async function syncDeadlines(
  company: CompanyRow,
  companyCountries: CompanyCountryRow[],
  referenceDate: string = todayInRome(),
): Promise<void> {
  try {
    const supabase = await createClient();
    const rules = loadAllRules().ok.map(({ rule }) => rule);
    const profile = toCompanyProfile(company, companyCountries);
    const generated = generateDeadlines(profile, rules, { referenceDate });
    const desired = toDesiredDeadlines(generated);

    const { data: existingData } = await supabase
      .from("deadlines")
      .select("*")
      .eq("company_id", company.id);
    const existing = (existingData ?? []) as DeadlineRow[];

    const { toInsert, toDeleteIds } = reconcileDeadlines(desired, existing);

    if (toDeleteIds.length > 0) {
      await supabase.from("deadlines").delete().in("id", toDeleteIds);
    }
    if (toInsert.length > 0) {
      await supabase.from("deadlines").insert(
        toInsert.map((deadline) => ({
          company_id: company.id,
          country_code: deadline.countryCode,
          kind: deadline.kind,
          due_date: deadline.dueDate,
          status: "open",
        })),
      );
    }
  } catch (error) {
    console.error("[deadlines-sync] failed:", error);
  }
}
