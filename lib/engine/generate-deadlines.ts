import {
  CANONICAL_MATERIALS,
  type CanonicalMaterial,
  type CountryRule,
  type DeadlineRule,
  type DeadlineSchedule,
  type EurBand,
} from "@/lib/rules/schema";
import type {
  CompanyCountryProfile,
  CompanyProfile,
  DeadlineKind,
  DeadlineWindow,
  EngineDeadline,
} from "./types";
import { textHasTodoVerify } from "./uncertainty";

export const DEFAULT_HORIZON_MONTHS = 12;

// ---------------------------------------------------------------------------
// Plain-date arithmetic (UTC-free: pure integer math on YYYY-MM-DD strings, so
// the same input always yields the same output on every machine/timezone).
// ---------------------------------------------------------------------------

interface PlainDate {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
}

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function daysInMonth(year: number, month: number): number {
  if (month === 2 && isLeapYear(year)) return 29;
  return DAYS_IN_MONTH[month - 1];
}

export function parseIsoDate(value: string): PlainDate {
  const match = ISO_DATE_RE.exec(value);
  if (!match) throw new TypeError(`expected an ISO date (YYYY-MM-DD), got "${value}"`);
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) {
    throw new TypeError(`invalid calendar date "${value}"`);
  }
  return { year, month, day };
}

function toIsoDate(date: PlainDate): string {
  const mm = String(date.month).padStart(2, "0");
  const dd = String(date.day).padStart(2, "0");
  return `${date.year}-${mm}-${dd}`;
}

/** Year+month shifted by `delta` months (floor division keeps negatives correct). */
function addMonths(year: number, month: number, delta: number): { year: number; month: number } {
  const index = year * 12 + (month - 1) + delta;
  return { year: Math.floor(index / 12), month: ((index % 12) + 12) % 12 + 1 };
}

// ---------------------------------------------------------------------------
// Schedule resolution
// ---------------------------------------------------------------------------

export interface ScheduleOccurrence {
  /** Reporting period the due date refers to: "2026", "2026-Q4", "2026-11". */
  periodLabel: string;
  /** ISO due date (YYYY-MM-DD). */
  dueDate: string;
}

function periodLabelFor(schedule: DeadlineSchedule, endYear: number, endMonth: number): string {
  switch (schedule.period) {
    case "year":
      return String(endYear);
    case "quarter":
      return `${endYear}-Q${endMonth / 3}`;
    case "month":
      return `${endYear}-${String(endMonth).padStart(2, "0")}`;
  }
}

function isPeriodEndMonth(period: DeadlineSchedule["period"], month: number): boolean {
  if (period === "year") return month === 12;
  if (period === "quarter") return month % 3 === 0;
  return true;
}

/**
 * Enumerate every occurrence of a YAML `schedule` whose due date falls inside
 * the window [referenceDate, referenceDate + horizonMonths] (both inclusive).
 * The due date of a period is `months_after_period_end` months after the last
 * month of the period, on `day_of_month` clamped to that month's length —
 * year boundaries fall out of the arithmetic naturally (Q4 2026 → 2027-01-20,
 * DE report 2026 → 2027-05-15, DE planned volumes 2027 → 2026-12-31).
 */
export function resolveSchedule(
  schedule: DeadlineSchedule,
  window: DeadlineWindow,
): ScheduleOccurrence[] {
  const start = parseIsoDate(window.referenceDate);
  const horizon = window.horizonMonths ?? DEFAULT_HORIZON_MONTHS;
  if (!Number.isInteger(horizon) || horizon < 1) {
    throw new TypeError(`horizonMonths must be a positive integer, got ${horizon}`);
  }
  const startIso = toIsoDate(start);
  const endMonth = addMonths(start.year, start.month, horizon);
  const endIso = toIsoDate({
    year: endMonth.year,
    month: endMonth.month,
    day: Math.min(start.day, daysInMonth(endMonth.year, endMonth.month)),
  });

  // Candidate period-end months: window months shifted back by the offset,
  // with a ±1 month buffer to absorb day-of-month effects.
  const startIndex = start.year * 12 + (start.month - 1);
  const lo = startIndex - schedule.months_after_period_end - 1;
  const hi = startIndex + horizon - schedule.months_after_period_end + 1;

  const occurrences: ScheduleOccurrence[] = [];
  for (let index = lo; index <= hi; index += 1) {
    const year = Math.floor(index / 12);
    const month = ((index % 12) + 12) % 12 + 1;
    if (!isPeriodEndMonth(schedule.period, month)) continue;

    const due = addMonths(year, month, schedule.months_after_period_end);
    const dueIso = toIsoDate({
      year: due.year,
      month: due.month,
      day: Math.min(schedule.day_of_month, daysInMonth(due.year, due.month)),
    });
    if (dueIso >= startIso && dueIso <= endIso) {
      occurrences.push({ periodLabel: periodLabelFor(schedule, year, month), dueDate: dueIso });
    }
  }
  return occurrences;
}

// ---------------------------------------------------------------------------
// generateDeadlines
// ---------------------------------------------------------------------------

function inBand(value: number, band: EurBand): boolean {
  if (band.min_exclusive !== undefined && value <= band.min_exclusive) return false;
  if (band.max_inclusive !== undefined && value > band.max_inclusive) return false;
  return true;
}

/**
 * Maps a YAML reporting-deadline kind onto the `deadlines` table kinds
 * (ARCHITECTURE.md §3). Naming convention, not a normative value.
 */
function dbKindFor(yamlKind: string): DeadlineKind {
  return yamlKind.toLowerCase().includes("payment") ? "payment" : "report";
}

function deadlineRuleUncertainty(entry: DeadlineRule): {
  uncertain?: true;
  uncertaintyNote?: string;
} {
  if (entry.uncertain || entry.todo_verify || textHasTodoVerify(entry.rule)) {
    return { uncertain: true, uncertaintyNote: entry.todo_verify?.trim() };
  }
  return {};
}

function conditionFields(entry: DeadlineRule): { conditional?: true; conditionNote?: string } {
  if (!entry.condition) return {};
  const thresholds = entry.condition_thresholds_kg
    ? " — " +
      Object.entries(entry.condition_thresholds_kg)
        .map(([material, kg]) => `${material}: ${kg} kg`)
        .join(", ")
    : "";
  return { conditional: true, conditionNote: `${entry.condition}${thresholds}` };
}

function sortMaterials(materials: CanonicalMaterial[]): CanonicalMaterial[] {
  return [...materials].sort(
    (a, b) => CANONICAL_MATERIALS.indexOf(a) - CANONICAL_MATERIALS.indexOf(b),
  );
}

/** One-off obligations (registration & co.) for a country the company is not yet registered in. */
function registrationDeadlines(
  company: CompanyProfile,
  country: CompanyCountryProfile,
  rule: CountryRule,
): EngineDeadline[] {
  if (country.status === "registered") return [];
  const domestic = company.establishmentCountry.toUpperCase() === rule.country_code;

  const deadlines: EngineDeadline[] = [];
  for (const requirement of rule.requirements) {
    // Fulfilled through reporting.deadlines — never duplicated as a one-off.
    if (requirement.covered_by_reporting) continue;
    if (requirement.applies_to === "non_established" && domestic) continue;

    const uncertain = textHasTodoVerify(requirement.note) || textHasTodoVerify(requirement.when);
    deadlines.push({
      countryCode: rule.country_code,
      kind: "registration",
      sourceKind: requirement.id,
      label: requirement.label,
      // The YAML has no machine-readable date for these ("prima della prima
      // vendita", "entro 30 giorni dall'inizio dell'attività") — the engine
      // never invents one.
      dueDate: null,
      periodLabel: "",
      ruleText: requirement.when,
      ...(uncertain ? { uncertain: true as const } : {}),
    });
  }
  return deadlines;
}

function occurrenceDeadlines(
  rule: CountryRule,
  entry: DeadlineRule,
  window: DeadlineWindow,
  materials?: CanonicalMaterial[],
): EngineDeadline[] {
  const base = {
    countryCode: rule.country_code,
    kind: dbKindFor(entry.kind),
    sourceKind: entry.kind,
    ruleText: entry.rule.trim(),
    ...(materials ? { materials: sortMaterials(materials) } : {}),
    ...conditionFields(entry),
    ...deadlineRuleUncertainty(entry),
  };

  if (!entry.schedule) {
    // No machine-readable date in the YAML (e.g. FR payment tiers driven by
    // invoices): emit a single informational deadline, never an invented date.
    return [{ ...base, dueDate: null, periodLabel: "" }];
  }
  return resolveSchedule(entry.schedule, window).map((occurrence) => ({
    ...base,
    dueDate: occurrence.dueDate,
    periodLabel: occurrence.periodLabel,
  }));
}

/** Recurring reporting/payment deadlines for one country. */
function reportingDeadlines(
  country: CompanyCountryProfile,
  rule: CountryRule,
  window: DeadlineWindow,
): EngineDeadline[] {
  const entries = rule.reporting.deadlines;
  const tiered = entries.filter((e) => e.applies_if_cac_eur);
  const plain = entries.filter((e) => !e.applies_if_cac_eur);

  const deadlines: EngineDeadline[] = [];

  for (const entry of plain) {
    if (entry.applies_if_contribution_eur) {
      // Tier condition the engine has no input for (prior-year contribution):
      // surface it as uncertain instead of assuming the tier applies.
      deadlines.push({
        countryCode: rule.country_code,
        kind: dbKindFor(entry.kind),
        sourceKind: entry.kind,
        dueDate: null,
        periodLabel: "",
        ruleText: entry.rule.trim(),
        uncertain: true,
        uncertaintyNote:
          "Tier depends on the prior-year contribution amount, which was not provided.",
      });
      continue;
    }
    deadlines.push(...occurrenceDeadlines(rule, entry, window));
  }

  if (tiered.length > 0) {
    deadlines.push(...cacTierDeadlines(country, rule, tiered, window));
  }
  return deadlines;
}

/**
 * CONAI-style variable periodicity: each material's prior-year CAC selects the
 * declaration tier (annual / quarterly / monthly). Without the CAC figures the
 * engine emits one uncertain, undated deadline — it never guesses a tier.
 */
function cacTierDeadlines(
  country: CompanyCountryProfile,
  rule: CountryRule,
  tiers: DeadlineRule[],
  window: DeadlineWindow,
): EngineDeadline[] {
  const cacByMaterial = country.priorYearCacEurByMaterial;
  const materials = cacByMaterial
    ? (Object.keys(cacByMaterial) as CanonicalMaterial[])
    : [];

  if (materials.length === 0) {
    return [
      {
        countryCode: rule.country_code,
        kind: "report",
        sourceKind: tiers.map((t) => t.kind).join("|"),
        dueDate: null,
        periodLabel: "",
        ruleText: tiers.map((t) => t.rule.trim()).join(" | "),
        uncertain: true,
        uncertaintyNote:
          "Reporting periodicity depends on the prior-year CAC per material; " +
          "provide priorYearCacEurByMaterial to resolve the tier.",
      },
    ];
  }

  const deadlines: EngineDeadline[] = [];
  const materialsByTier = new Map<DeadlineRule, CanonicalMaterial[]>();
  for (const material of materials) {
    const cac = cacByMaterial![material]!;
    const tier = tiers.find((t) => inBand(cac, t.applies_if_cac_eur!));
    if (!tier) {
      // The YAML bands should cover every amount; if they do not, say so.
      deadlines.push({
        countryCode: rule.country_code,
        kind: "report",
        sourceKind: tiers.map((t) => t.kind).join("|"),
        dueDate: null,
        periodLabel: "",
        ruleText: tiers.map((t) => t.rule.trim()).join(" | "),
        materials: [material],
        uncertain: true,
        uncertaintyNote: `No periodicity tier matches a prior-year CAC of ${cac} € for "${material}".`,
      });
      continue;
    }
    materialsByTier.set(tier, [...(materialsByTier.get(tier) ?? []), material]);
  }

  for (const [tier, tierMaterials] of materialsByTier) {
    deadlines.push(...occurrenceDeadlines(rule, tier, window, tierMaterials));
  }
  return deadlines;
}

function compareDeadlines(a: EngineDeadline, b: EngineDeadline): number {
  if (a.dueDate !== null && b.dueDate !== null && a.dueDate !== b.dueDate) {
    return a.dueDate < b.dueDate ? -1 : 1;
  }
  if ((a.dueDate === null) !== (b.dueDate === null)) return a.dueDate === null ? 1 : -1;
  if (a.countryCode !== b.countryCode) return a.countryCode < b.countryCode ? -1 : 1;
  if (a.kind !== b.kind) return a.kind === "registration" ? -1 : b.kind === "registration" ? 1 : 0;
  return a.sourceKind < b.sourceKind ? -1 : a.sourceKind > b.sourceKind ? 1 : 0;
}

/**
 * Generate the concrete deadlines for a company across every country it is
 * active in (ARCHITECTURE.md §4). Pure: rules come in as parsed data, "today"
 * is `window.referenceDate`. Dated deadlines come first, sorted ascending;
 * undated (informational) ones follow, registration first.
 */
export function generateDeadlines(
  company: CompanyProfile,
  rules: CountryRule[],
  window: DeadlineWindow,
): EngineDeadline[] {
  parseIsoDate(window.referenceDate); // fail fast on malformed input
  const byCode = new Map(rules.map((rule) => [rule.country_code, rule]));

  const deadlines: EngineDeadline[] = [];
  for (const country of company.countries) {
    const rule = byCode.get(country.countryCode.toUpperCase());
    if (!rule) continue; // uncovered countries are the caller's concern
    deadlines.push(...registrationDeadlines(company, country, rule));
    deadlines.push(...reportingDeadlines(country, rule, window));
  }
  return deadlines.sort(compareDeadlines);
}

/** Earliest dated deadline, falling back to the first undated one. */
export function pickNextDeadline(deadlines: EngineDeadline[]): EngineDeadline | null {
  return deadlines.find((d) => d.dueDate !== null) ?? deadlines[0] ?? null;
}
