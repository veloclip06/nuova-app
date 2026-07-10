/**
 * Plan gating — single source of truth (pricing ratified 2026-07-10, ARCHITECTURE §8).
 *
 * Annual billing only, two paid plans:
 * - essenziale (149€/year): up to 3 covered countries, unlimited SKUs, reports,
 *   email reminders.
 * - completo (249€/year): every covered country (including future ones), CSV
 *   import, report history.
 * 'free' is a DB state, not a product: onboarding, dashboard (seals + deadlines)
 * and SKU management work; every output (reports, reminders, CSV, history) is
 * gated behind an upgrade CTA.
 *
 * Pure functions, no I/O and no env — safe to import from client components.
 * Every gate (UI and server) MUST go through this module.
 *
 * Downgrade note (completo → essenziale via the Customer Portal with more than
 * 3 covered countries): existing company_countries rows are grandfathered —
 * never deleted, dashboards and reports keep working for them. The country cap
 * only bites at selection time. Same principle for CSV-imported SKUs: data
 * stays, the feature gates forward.
 */

export type PlanId = "free" | "essenziale" | "completo";

export const PLAN_IDS: readonly PlanId[] = ["free", "essenziale", "completo"];

/**
 * Fail-closed normalisation of the DB `companies.plan` value. The 0002
 * migration constrains the column to the three PlanIds, but webhooks and
 * hand-edited rows should never grant access by accident: legacy placeholder
 * values map to their renamed plan, anything else is 'free'.
 */
export function normalizePlan(value: string | null | undefined): PlanId {
  if (value === "free" || value === "essenziale" || value === "completo") return value;
  if (value === "starter") return "essenziale";
  if (value === "pro") return "completo";
  return "free";
}

export function isPaidPlan(plan: PlanId): boolean {
  return plan === "essenziale" || plan === "completo";
}

/** Reports (generate + view) are part of both paid plans. */
export function canAccessReports(plan: PlanId): boolean {
  return isPaidPlan(plan);
}

/** Deadline email reminders (cron) go to paying plans only. */
export function canReceiveReminders(plan: PlanId): boolean {
  return isPaidPlan(plan);
}

/** CSV import is a completo-only feature. */
export function canImportCsv(plan: PlanId): boolean {
  return plan === "completo";
}

/** Report history (storico) is a completo-only feature. */
export function canSeeReportHistory(plan: PlanId): boolean {
  return plan === "completo";
}

/**
 * Maximum number of COVERED countries a plan may select (null = unlimited).
 * Interest-only countries (not covered by /rules, no company_countries row)
 * are never capped. Free shares the essenziale cap so buying Essenziale is
 * always possible without shedding countries.
 */
export function maxCoveredCountries(plan: PlanId): number | null {
  return plan === "completo" ? null : 3;
}

/** Can a company on `plan` with `currentCoveredCount` countries add one more? */
export function canAddCoveredCountry(plan: PlanId, currentCoveredCount: number): boolean {
  const max = maxCoveredCountries(plan);
  return max === null || currentCoveredCount < max;
}
