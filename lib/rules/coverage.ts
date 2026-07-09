import { loadAllRules } from "./load";
import type { CountryRule } from "./schema";

/**
 * Coverage = data, never layout (product decision ratified 2026-07-10):
 * the set of covered countries is derived at runtime from the loaded /rules
 * files. No component or copy may hardcode which countries are covered —
 * adding a country must require only a new rules/*.yaml (+ seed).
 *
 * Server-only (loadAllRules reads the filesystem). Client components receive
 * the derived values as props.
 */
export interface CoveredCountry {
  /** ISO 3166-1 alpha-2, from the rule file. */
  code: string;
  /** Italian country name, from the rule file. */
  name: string;
  /** Official register name (LUCID, CITEO, CONAI, …). */
  registerName: string;
}

/** Covered countries from /rules, sorted by Italian name. */
export function getCoveredCountries(rules?: CountryRule[]): CoveredCountry[] {
  const source = rules ?? loadAllRules().ok.map(({ rule }) => rule);
  return source
    .map((rule) => ({
      code: rule.country_code,
      name: rule.country_name,
      registerName: rule.register.name,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "it"));
}
