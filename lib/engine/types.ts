import type {
  ArStatus,
  ArValue,
  CanonicalMaterial,
  CountryRule,
} from "@/lib/rules/schema";

/**
 * Explicit input/output types for the deterministic rules engine
 * (ARCHITECTURE.md §4). The engine is pure: rules arrive already parsed
 * (lib/rules/load.ts owns the I/O), "today" is always an explicit input,
 * and every value that traces to an unverified YAML field carries
 * `uncertain: true` — never presented as settled.
 *
 * The engine emits data and stable error codes, never UI copy: Italian
 * strings live in locales/it.json and are resolved by the UI layer.
 */

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

/** Official source reference propagated verbatim from the YAML `sources`. */
export interface RuleSource {
  title: string;
  url: string;
  accessed: string;
}

export type RulesStatus = CountryRule["status"];

// ---------------------------------------------------------------------------
// checkObligations
// ---------------------------------------------------------------------------

export interface CheckerInput {
  /** ISO 3166-1 alpha-2 code of the country the company is established in. */
  establishmentCountry: string;
  /** ISO codes of the countries the company sells into. */
  sellingCountries: string[];
  /** Sales channel ids from the checker, e.g. "amazon", "ebay", "shopify". */
  channels: string[];
  /** Product type ids from the checker (informational for now). */
  productTypes?: string[];
  /** Declared yearly order band per country (checker band id, informational). */
  volumeBandByCountry?: Record<string, string>;
  /** ISO date (YYYY-MM-DD) used as "today" — keeps the function pure. */
  referenceDate: string;
}

export type RiskLevel = "high" | "medium";

export interface RiskFactor {
  text: string;
  sourceUrl?: string;
  uncertain?: true;
}

export interface ObligationRequirement {
  id: string;
  label: string;
  when: string;
  note?: string;
  uncertain?: true;
  uncertaintyNote?: string;
}

export interface ObligationRegister {
  name: string;
  authority: string;
  portalUrl: string;
  /** null = not established on an official source yet (TODO-VERIFY). */
  costRegistration: number | null;
  uncertain?: true;
}

/** EU-established seller vs third-country seller (EU_MEMBER_STATES). */
export type ArSellerType = "eu" | "non_eu";

/**
 * The YAML AR case resolved for THIS company: eu_seller when the establishment
 * country is an EU member state, non_eu_seller otherwise (verifica-com-2025-982.md).
 * `uncertain` is true when the status itself is uncertain (DE/IT eu_seller,
 * Omnibus pending) or a national obligation stands but the Omnibus effect on it
 * is open (FR eu_seller) — never for confirmed third-country obligations.
 */
export interface AuthorisedRepresentativeStatus {
  sellerType: ArSellerType;
  status: ArStatus;
  /** Time-independent value, verbatim from the YAML (e.g. mandatory). */
  value?: ArValue;
  /** Value until 11/08/2026 — the day before PPWR art. 45(3) applies. */
  valueUntil20260811?: ArValue;
  /** Value from 12/08/2026 — PPWR art. 45(3) application date. */
  valueFrom20260812?: ArValue;
  uncertain: boolean;
  notes: string;
}

export interface CountryObligation {
  countryCode: string;
  countryName: string;
  obligated: boolean;
  /**
   * true when establishmentCountry === countryCode. The UI differentiates the
   * copy for the domestic case (e.g. CONAI: the CAC on packaging bought from
   * domestic suppliers is typically already paid upstream on first transfer);
   * the engine only exposes the flag, it does not resolve that nuance.
   */
  domestic: boolean;
  register: ObligationRegister;
  /** Already filtered by `applies_to` (non-established-only items dropped for domestic sellers). */
  requirements: ObligationRequirement[];
  nextDeadline: EngineDeadline | null;
  /**
   * "medium" whenever obligated (penalties always apply); promoted to "high"
   * only when the country's marketplaces block non-compliant listings AND the
   * company actually sells on a marketplace channel.
   */
  riskLevel: RiskLevel;
  riskFactors: RiskFactor[];
  /** null for domestic sellers — the AR question only exists for non-established ones. */
  authorisedRepresentative: AuthorisedRepresentativeStatus | null;
  deMinimis: string;
  penalties: { summary: string; detailUrl: string; uncertain?: true };
  sources: RuleSource[];
  rulesStatus: RulesStatus;
  lastVerifiedByHuman: string | null;
  /** true if ANY field above is uncertain or the rule file is still a draft. */
  uncertain: boolean;
}

// ---------------------------------------------------------------------------
// generateDeadlines
// ---------------------------------------------------------------------------

/** Aligned with the `deadlines` table kinds (ARCHITECTURE.md §3). */
export type DeadlineKind = "registration" | "report" | "payment";

export interface EngineDeadline {
  countryCode: string;
  kind: DeadlineKind;
  /** Traces back to the YAML: requirement id or reporting deadline kind. */
  sourceKind: string;
  /** Human-oriented label (requirement label) when one exists in the YAML. */
  label?: string;
  /**
   * ISO date (YYYY-MM-DD), or null when the YAML has no machine-readable
   * schedule for it (e.g. "prima della prima vendita"). The engine never
   * invents a date that is not in the rules.
   */
  dueDate: string | null;
  /** Reporting period the deadline refers to: "2026", "2026-Q4", "2026-11"; "" if none. */
  periodLabel: string;
  /** The sourced free-text rule from the YAML, always carried along. */
  ruleText: string;
  /** CONAI-style tiers: which canonical materials this occurrence covers. */
  materials?: CanonicalMaterial[];
  /** Applies only under a condition the engine could not evaluate (never silently dropped). */
  conditional?: true;
  conditionNote?: string;
  uncertain?: true;
  uncertaintyNote?: string;
}

export type CompanyCountryStatus = "not_registered" | "in_progress" | "registered";

export interface CompanyCountryProfile {
  countryCode: string;
  status: CompanyCountryStatus;
  /**
   * IT/CONAI: prior-year Contributo Ambientale (€) per canonical material —
   * selects the declaration periodicity tier. When absent the engine emits an
   * `uncertain` deadline instead of guessing a tier.
   */
  priorYearCacEurByMaterial?: Partial<Record<CanonicalMaterial, number>>;
}

export interface CompanyProfile {
  establishmentCountry: string;
  countries: CompanyCountryProfile[];
}

export interface DeadlineWindow {
  /** ISO date (YYYY-MM-DD), inclusive start of the window. */
  referenceDate: string;
  /** How far ahead to generate, default 12 months. */
  horizonMonths?: number;
}

// ---------------------------------------------------------------------------
// computeReport
// ---------------------------------------------------------------------------

export interface PackagingComponentInput {
  material: CanonicalMaterial;
  /** Grams per unit; null = missing datum → actionable error, never a wrong report. */
  weightGrams: number | null;
}

export interface SkuInput {
  skuCode: string;
  components: PackagingComponentInput[];
}

export interface VolumeInput {
  skuCode: string;
  units: number;
}

export interface ReportInput {
  rule: CountryRule;
  /** "YYYY" | "YYYY-Qn" | "YYYY-MM" — must match the country's period format. */
  period: string;
  skus: SkuInput[];
  /** Sales volumes already filtered to (country, period) by the caller. */
  volumes: VolumeInput[];
}

export type ReportErrorCode =
  | "MISSING_PACKAGING_COMPONENTS"
  | "MISSING_COMPONENT_WEIGHT"
  | "UNKNOWN_SKU_IN_VOLUMES"
  | "UNMAPPED_MATERIAL"
  | "INVALID_UNITS"
  | "INVALID_PERIOD";

export interface ReportError {
  code: ReportErrorCode;
  skuCode?: string;
  /** English, for logs/debugging; the UI translates by `code` (it.json). */
  message: string;
}

export interface MaterialBreakdownRow {
  canonical: CanonicalMaterial;
  localName: string;
  localCode?: string;
  /** Σ(weight_grams × units) / 1000, rounded to 3 decimals (LUCID declares kg, 3 decimals). */
  totalWeightKg: number;
  /** Units sold of SKUs containing at least one component of this material. */
  units: number;
  uncertain?: true;
  uncertaintyNote?: string;
}

export interface LocalCategoryTotal {
  localName: string;
  localCode?: string;
  totalWeightKg: number;
  uncertain?: true;
}

export interface MaterialBreakdown {
  countryCode: string;
  period: string;
  /** One row per canonical material present in the sold SKUs (§5: users see canonical). */
  rows: MaterialBreakdownRow[];
  /**
   * Totals aggregated by local register category — canonical materials that
   * share one local category are merged (DE: wood + other → "Sonstiges
   * Material" 80000). This is what gets pasted into the national portal.
   */
  byLocalCategory: LocalCategoryTotal[];
  rulesStatus: RulesStatus;
  uncertain: boolean;
}

export type ReportResult =
  | { ok: true; report: MaterialBreakdown }
  | { ok: false; errors: ReportError[] };
