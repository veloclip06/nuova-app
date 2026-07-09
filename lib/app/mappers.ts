import type {
  CheckerInput,
  CompanyProfile,
  SkuInput,
  VolumeInput,
} from "@/lib/engine/types";
import type { CanonicalMaterial } from "@/lib/rules/schema";
import type {
  CompanyCountryRow,
  CompanyRow,
  PackagingComponentRow,
  SalesVolumeRow,
  SkuRow,
} from "./types";

/**
 * Pure adapters: authenticated DB rows (snake_case) → deterministic engine
 * inputs (camelCase). The engine stays pure and DB-agnostic; all coupling to
 * the schema lives here so it is unit-tested in one place.
 */

/**
 * Company + selling countries → CheckerInput for `checkObligations`.
 * Channels are not stored in the app model (unlike the public checker), so the
 * dashboard passes none: risk stays "medium" (penalties always apply) and the
 * seal — which reflects legal status, not channel — is unaffected.
 */
export function toCheckerInput(
  company: CompanyRow,
  companyCountries: CompanyCountryRow[],
  referenceDate: string,
  channels: string[] = [],
): CheckerInput {
  return {
    establishmentCountry: company.establishment_country,
    sellingCountries: companyCountries.map((c) => c.country_code),
    channels,
    referenceDate,
  };
}

/** Company + selling countries (with per-country status) → CompanyProfile for `generateDeadlines`. */
export function toCompanyProfile(
  company: CompanyRow,
  companyCountries: CompanyCountryRow[],
): CompanyProfile {
  return {
    establishmentCountry: company.establishment_country,
    countries: companyCountries.map((c) => ({
      countryCode: c.country_code,
      status: c.status,
    })),
  };
}

/**
 * SKU rows + their packaging components → SkuInput[] for `computeReport`.
 * A missing/blank weight becomes `null` (an actionable MISSING_COMPONENT_WEIGHT
 * error downstream) rather than a silently wrong 0.
 */
export function toSkuInputs(
  skus: SkuRow[],
  components: PackagingComponentRow[],
): SkuInput[] {
  const bySku = new Map<string, PackagingComponentRow[]>();
  for (const component of components) {
    const list = bySku.get(component.sku_id) ?? [];
    list.push(component);
    bySku.set(component.sku_id, list);
  }
  return skus.map((sku) => ({
    skuCode: sku.sku_code,
    components: (bySku.get(sku.id) ?? []).map((component) => ({
      material: component.material as CanonicalMaterial,
      weightGrams: toWeightGrams(component.weight_grams),
    })),
  }));
}

/** Sales-volume rows → VolumeInput[], resolving sku_id → sku_code. Rows whose SKU is unknown are dropped. */
export function toVolumeInputs(
  volumes: SalesVolumeRow[],
  skus: SkuRow[],
): VolumeInput[] {
  const codeById = new Map(skus.map((sku) => [sku.id, sku.sku_code]));
  const result: VolumeInput[] = [];
  for (const volume of volumes) {
    const skuCode = codeById.get(volume.sku_id);
    if (skuCode === undefined) continue;
    result.push({ skuCode, units: volume.units });
  }
  return result;
}

/** numeric(10,2) → number | null. Empty/invalid → null (missing datum, not zero). */
function toWeightGrams(value: number | string | null): number | null {
  if (value === null || value === "") return null;
  const grams = typeof value === "number" ? value : Number(value);
  return Number.isFinite(grams) ? grams : null;
}
