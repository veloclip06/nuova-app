import type { CountryObligation } from "@/lib/engine/types";
import { t } from "@/lib/i18n";

/**
 * Country × seller-type authorised-representative copy
 * (check.result.ar.{code}.{eu|non_eu} — the six recommended texts from the
 * 2026-07-09 primary-source verification, verifica-com-2025-982.md). Shared by
 * the result card and the email report; falls back to the sourced YAML notes
 * for countries without dedicated copy.
 */
export function arCopyFor(obligation: CountryObligation): string {
  const ar = obligation.authorisedRepresentative;
  if (!ar) return "";
  const key = `check.result.ar.${obligation.countryCode}.${ar.sellerType}`;
  const copy = t(key);
  return copy === key ? ar.notes : copy;
}
