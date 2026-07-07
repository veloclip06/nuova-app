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
});

const deadlineRuleSchema = z.object({
  kind: z.string().min(1),
  rule: z.string().min(1),
});

const materialCategorySchema = z.object({
  canonical: canonicalMaterialSchema,
  local_name: z.string().min(1),
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
});

const scopeSchema = z.object({
  who_is_obligated: z.string().min(1),
  // "none" (DE) or a descriptive string (FR/IT)
  de_minimis: z.string().min(1),
  marketplace_enforcement: z.string().min(1),
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
});

/**
 * Uncertainty is first-class: the engine must propagate any of these as
 * `uncertain: true` and never present them as settled (see PROMPT 2).
 */
export const arRequirementSchema = z.enum([
  "yes",
  "no",
  "uncertain",
  "yes_currently_uncertain_future",
]);

const authorisedRepresentativeSchema = z.object({
  required_for_non_established: arRequirementSchema,
  note: z.string().min(1),
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
