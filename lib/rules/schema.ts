import { z } from "zod";

/**
 * Zod schema for the country rule files in /rules/*.yaml.
 *
 * This is the contract between the (human-maintained) YAML and the deterministic
 * rules engine. Every normative value in the YAML must trace to an official
 * `sources` entry — see CLAUDE.md. Values that are not yet confirmed stay as
 * `null` / carry a TODO-VERIFY comment and MUST keep `status: draft`.
 */

/** Canonical material taxonomy — ARCHITECTURE.md §5. */
export const CANONICAL_MATERIALS = [
  "paper_cardboard",
  "plastic",
  "glass",
  "ferrous_metal",
  "aluminium",
  "wood",
  "composite_beverage",
  "composite_other",
  "other",
] as const;

export const canonicalMaterialSchema = z.enum(CANONICAL_MATERIALS);
export type CanonicalMaterial = z.infer<typeof canonicalMaterialSchema>;

const requirementSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  when: z.string().min(1),
  note: z.string().optional(),
  // Who the requirement applies to; defaults to every obligated company.
  // "non_established" = only companies without an establishment in the country
  // (e.g. FR mandataire, IT foreign domicile) — mirrors the sourced label/note.
  applies_to: z.enum(["all", "non_established"]).optional(),
  // Structured mirror of `when: vedi reporting` — the requirement is fulfilled
  // through the reporting.deadlines entries, so the engine must not emit it as
  // a separate one-off deadline.
  covered_by_reporting: z.boolean().optional(),
});

/**
 * Machine-readable due-date rule, country-agnostic: the deadline falls
 * `months_after_period_end` months after the end of each reporting `period`,
 * on `day_of_month` (clamped to the last day of the month). Negative offsets
 * express "before the period starts" (e.g. DE initial planned volume report).
 * Every schedule MUST restate a value already present in the sourced `rule`
 * text of the same entry — never introduce new normative values here.
 */
const deadlineScheduleSchema = z.object({
  period: z.enum(["year", "quarter", "month"]),
  months_after_period_end: z.number().int(),
  day_of_month: z.number().int().min(1).max(31),
});

/** Half-open EUR band (min exclusive, max inclusive) used by tiered periodicity. */
const eurBandSchema = z
  .object({
    min_exclusive: z.number().nonnegative().optional(),
    max_inclusive: z.number().positive().optional(),
  })
  .refine(
    (b) => b.min_exclusive !== undefined || b.max_inclusive !== undefined,
    { message: "eur band needs at least one bound" },
  );

const deadlineRuleSchema = z.object({
  kind: z.string().min(1),
  rule: z.string().min(1),
  schedule: deadlineScheduleSchema.optional(),
  // IT/CONAI: tier selected per material by prior-year CAC (€/material).
  applies_if_cac_eur: eurBandSchema.optional(),
  // FR/Citeo payment: tier selected by prior-year contribution (€).
  applies_if_contribution_eur: eurBandSchema.optional(),
  // Deadline that only applies when a condition holds (e.g. DE
  // Vollständigkeitserklärung §11(4) thresholds). The engine emits it as
  // `conditional` when it cannot evaluate the condition — never drops it.
  condition: z.string().min(1).optional(),
  condition_thresholds_kg: z.record(z.number().positive()).optional(),
  uncertain: z.boolean().optional(),
  todo_verify: z.string().min(1).optional(),
});

const materialCategorySchema = z.object({
  canonical: canonicalMaterialSchema,
  local_name: z.string().min(1),
  // Official register code when one exists (e.g. LUCID Materialart codes).
  local_code: z.string().min(1).optional(),
  uncertain: z.boolean().optional(),
  todo_verify: z.string().min(1).optional(),
});

const sourceSchema = z.object({
  title: z.string().min(1),
  url: z.string().url(),
  accessed: z.string().min(1), // ISO date (kept as string, not coerced)
});

const registerSchema = z.object({
  name: z.string().min(1),
  authority: z.string().min(1),
  portal_url: z.string().url(),
  languages: z.array(z.string().length(2)).min(1),
  // number when known, null + TODO-VERIFY when not (e.g. FR)
  cost_registration: z.number().nonnegative().nullable(),
  // Structured mirror of a TODO-VERIFY that would otherwise live in a YAML
  // comment (comments are lost at parse time and could not propagate).
  cost_registration_uncertain: z.boolean().optional(),
});

const scopeSchema = z.object({
  who_is_obligated: z.string().min(1),
  // "none" (DE) or a descriptive string (FR/IT)
  de_minimis: z.string().min(1),
  marketplace_enforcement: z.string().min(1),
  // Structured restatement of `marketplace_enforcement`: do marketplaces block
  // non-compliant listings pre-sale? Drives deterministic risk derivation.
  marketplace_blocking: z.enum(["yes", "no", "uncertain"]).optional(),
});

const reportingSchema = z.object({
  frequency: z.string().min(1),
  period_format: z.string().min(1),
  deadlines: z.array(deadlineRuleSchema).min(1),
  method: z.string().min(1),
});

const penaltiesSchema = z.object({
  summary: z.string().min(1),
  detail_url: z.string().url(),
  // Explicit marker when the summary itself flags an unresolved source
  // conflict or TODO-VERIFY (e.g. FR Triman amount, IT art. 261 amounts).
  uncertain: z.boolean().optional(),
});

/**
 * Authorised representative (PPWR art. 45(3) + Environmental Omnibus
 * COM/2025/982). Structured per seller type — the obligation differs for
 * EU-established vs third-country producers (docs: verifica-com-2025-982.md,
 * primary sources verified 2026-07-09). Uncertainty is first-class: the engine
 * must propagate `status: uncertain` / `omnibus_effect: uncertain` as
 * `uncertain: true` and never present them as settled.
 */
export const arStatusSchema = z.enum([
  // Omnibus pending: the obligation may or may not apply — badge "in verifica".
  "uncertain",
  // Obligation established (e.g. third-country producers: the proposed
  // suspension explicitly excludes them).
  "confirmed",
  // Obligation already in force under pre-existing NATIONAL law (e.g. FR
  // mandataire, loi AGEC) — the Omnibus effect on it may still be uncertain.
  "confirmed_national",
]);
export type ArStatus = z.infer<typeof arStatusSchema>;

export const arValueSchema = z.enum([
  "optional",
  "mandatory",
  "mandatory_unless_omnibus_adopted",
]);
export type ArValue = z.infer<typeof arValueSchema>;

const arSellerCaseSchema = z
  .object({
    status: arStatusSchema,
    /** Time-independent value (e.g. non-EU: mandatory; FR national law). */
    value: arValueSchema.optional(),
    /** Value until 11/08/2026 — the day before PPWR art. 45(3) applies. */
    value_until_2026_08_11: arValueSchema.optional(),
    /** Value from 12/08/2026 — PPWR art. 45(3) application date. */
    value_from_2026_08_12: arValueSchema.optional(),
    /** FR: national obligation stands, the Omnibus effect on it is open. */
    omnibus_effect: z.literal("uncertain").optional(),
  })
  .refine(
    (c) => c.value !== undefined || c.value_from_2026_08_12 !== undefined,
    { message: "seller case needs `value` or `value_from_2026_08_12`" },
  );
export type ArSellerCase = z.infer<typeof arSellerCaseSchema>;

export const arRequirementSchema = z.object({
  eu_seller: arSellerCaseSchema,
  non_eu_seller: arSellerCaseSchema,
});
export type ArRequirement = z.infer<typeof arRequirementSchema>;

const authorisedRepresentativeSchema = z.object({
  required_for_non_established: arRequirementSchema,
  notes: z.string().min(1),
});

export const countryRuleSchema = z
  .object({
    country_code: z
      .string()
      .length(2)
      .regex(/^[A-Z]{2}$/, "country_code must be a 2-letter uppercase code"),
    country_name: z.string().min(1),
    status: z.enum(["draft", "verified"]),
    // null until a human signs off — never auto-promoted
    last_verified_by_human: z.string().nullable(),
    register: registerSchema,
    scope: scopeSchema,
    requirements: z.array(requirementSchema).min(1),
    reporting: reportingSchema,
    material_categories: z
      .array(materialCategorySchema)
      .min(1)
      .refine(
        (cats) =>
          new Set(cats.map((c) => c.canonical)).size === cats.length,
        { message: "duplicate canonical material in material_categories" },
      ),
    penalties: penaltiesSchema,
    authorised_representative: authorisedRepresentativeSchema,
    sources: z.array(sourceSchema).min(1),
  })
  // A file may only be `verified` once a human has signed it off.
  .refine(
    (r) => r.status !== "verified" || r.last_verified_by_human !== null,
    {
      message:
        "status: verified requires last_verified_by_human to be set (CLAUDE.md)",
      path: ["status"],
    },
  );

export type CountryRule = z.infer<typeof countryRuleSchema>;
export type CountryRequirement = z.infer<typeof requirementSchema>;
export type DeadlineSchedule = z.infer<typeof deadlineScheduleSchema>;
export type DeadlineRule = z.infer<typeof deadlineRuleSchema>;
export type EurBand = z.infer<typeof eurBandSchema>;
export type MaterialCategory = z.infer<typeof materialCategorySchema>;
