import {
  CANONICAL_MATERIALS,
  type CanonicalMaterial,
  type CountryRule,
  type MaterialCategory,
} from "@/lib/rules/schema";
import type {
  LocalCategoryTotal,
  MaterialBreakdownRow,
  ReportError,
  ReportInput,
  ReportResult,
} from "./types";
import { isDraft } from "./uncertainty";

const YEAR_RE = /^\d{4}$/;
const QUARTER_RE = /^\d{4}-Q[1-4]$/;
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

function isValidPeriod(period: string, periodFormat: string): boolean {
  // "YYYY" is the only machine-readable period_format token in the YAML today
  // (DE/FR); anything else (IT's variable periodicity) accepts all three shapes.
  if (periodFormat === "YYYY") return YEAR_RE.test(period);
  return YEAR_RE.test(period) || QUARTER_RE.test(period) || MONTH_RE.test(period);
}

/** Rounds Σgrams to whole grams == kg with 3 decimals (LUCID declares kg, 3 decimals). */
function gramsToKg3(grams: number): number {
  return Math.round(grams) / 1000;
}

/**
 * Compute the per-material report for one country and period
 * (ARCHITECTURE.md §4): Σ(weight_grams × units) per canonical material,
 * converted to the country's local register categories only in the output
 * (§5 — users always see the canonical taxonomy).
 *
 * Data problems (an SKU without packaging weights, unknown SKUs, bad units)
 * return `ok: false` with EVERY actionable error collected — never a partial
 * or silently wrong report.
 */
export function computeReport(input: ReportInput): ReportResult {
  const { rule, period, skus, volumes } = input;
  const errors: ReportError[] = [];

  if (!isValidPeriod(period, rule.reporting.period_format)) {
    errors.push({
      code: "INVALID_PERIOD",
      message:
        `Period "${period}" is not valid for ${rule.country_code} ` +
        `(expected format: ${rule.reporting.period_format}).`,
    });
  }

  const skuByCode = new Map(skus.map((sku) => [sku.skuCode, sku]));
  const categoryByCanonical = new Map<CanonicalMaterial, MaterialCategory>(
    rule.material_categories.map((category) => [category.canonical, category]),
  );

  // Aggregate volumes per SKU first (defensive: duplicate rows sum up).
  const unitsBySku = new Map<string, number>();
  for (const volume of volumes) {
    if (!Number.isInteger(volume.units) || volume.units < 0) {
      errors.push({
        code: "INVALID_UNITS",
        skuCode: volume.skuCode,
        message: `SKU "${volume.skuCode}" has invalid units (${volume.units}); expected a non-negative integer.`,
      });
      continue;
    }
    unitsBySku.set(volume.skuCode, (unitsBySku.get(volume.skuCode) ?? 0) + volume.units);
  }

  // Validate every sold SKU before computing anything.
  for (const [skuCode] of unitsBySku) {
    const sku = skuByCode.get(skuCode);
    if (!sku) {
      errors.push({
        code: "UNKNOWN_SKU_IN_VOLUMES",
        skuCode,
        message: `Sales volumes reference SKU "${skuCode}", which is not in the catalogue.`,
      });
      continue;
    }
    if (sku.components.length === 0) {
      errors.push({
        code: "MISSING_PACKAGING_COMPONENTS",
        skuCode,
        message:
          `SKU "${skuCode}" has no packaging components; ` +
          `add its materials and weights before generating the report.`,
      });
      continue;
    }
    for (const component of sku.components) {
      if (
        component.weightGrams === null ||
        !Number.isFinite(component.weightGrams) ||
        component.weightGrams < 0
      ) {
        errors.push({
          code: "MISSING_COMPONENT_WEIGHT",
          skuCode,
          message:
            `SKU "${skuCode}" has a "${component.material}" component without a valid ` +
            `weight in grams; complete the packaging data before generating the report.`,
        });
      }
      if (!categoryByCanonical.has(component.material)) {
        errors.push({
          code: "UNMAPPED_MATERIAL",
          skuCode,
          message:
            `Material "${component.material}" of SKU "${skuCode}" has no local category ` +
            `mapping in the ${rule.country_code} rules.`,
        });
      }
    }
  }

  if (errors.length > 0) return { ok: false, errors };

  // Σ(weight_grams × units) per canonical material.
  const gramsByCanonical = new Map<CanonicalMaterial, number>();
  const unitsByCanonical = new Map<CanonicalMaterial, number>();
  for (const [skuCode, units] of unitsBySku) {
    const sku = skuByCode.get(skuCode)!;
    const materialsInSku = new Set<CanonicalMaterial>();
    for (const component of sku.components) {
      gramsByCanonical.set(
        component.material,
        (gramsByCanonical.get(component.material) ?? 0) + component.weightGrams! * units,
      );
      materialsInSku.add(component.material);
    }
    // `units` counts sold units of SKUs containing the material (a SKU with
    // two plastic components still counts its units once for "plastic").
    for (const material of materialsInSku) {
      unitsByCanonical.set(material, (unitsByCanonical.get(material) ?? 0) + units);
    }
  }

  // Canonical rows in taxonomy order, local names/codes attached (§5).
  const rows: MaterialBreakdownRow[] = [];
  for (const canonical of CANONICAL_MATERIALS) {
    const grams = gramsByCanonical.get(canonical);
    if (grams === undefined) continue;
    const category = categoryByCanonical.get(canonical)!;
    const uncertain = category.uncertain === true;
    rows.push({
      canonical,
      localName: category.local_name,
      ...(category.local_code ? { localCode: category.local_code } : {}),
      totalWeightKg: gramsToKg3(grams),
      units: unitsByCanonical.get(canonical) ?? 0,
      ...(uncertain ? { uncertain: true as const } : {}),
      ...(category.todo_verify ? { uncertaintyNote: category.todo_verify.trim() } : {}),
    });
  }

  // Local register categories: canonical materials sharing one local category
  // merge (DE: wood + other → "Sonstiges Material" 80000). Sum raw grams to
  // avoid double rounding.
  const localTotals = new Map<string, LocalCategoryTotal & { grams: number }>();
  for (const canonical of CANONICAL_MATERIALS) {
    const grams = gramsByCanonical.get(canonical);
    if (grams === undefined) continue;
    const category = categoryByCanonical.get(canonical)!;
    const key = `${category.local_code ?? ""}|${category.local_name}`;
    const existing = localTotals.get(key);
    if (existing) {
      existing.grams += grams;
      if (category.uncertain) existing.uncertain = true;
    } else {
      localTotals.set(key, {
        localName: category.local_name,
        ...(category.local_code ? { localCode: category.local_code } : {}),
        totalWeightKg: 0, // filled below from the raw grams
        grams,
        ...(category.uncertain ? { uncertain: true as const } : {}),
      });
    }
  }
  const byLocalCategory: LocalCategoryTotal[] = [...localTotals.values()].map(
    ({ grams, ...total }) => ({ ...total, totalWeightKg: gramsToKg3(grams) }),
  );

  const uncertain = isDraft(rule) || rows.some((row) => row.uncertain);
  return {
    ok: true,
    report: {
      countryCode: rule.country_code,
      period,
      rows,
      byLocalCategory,
      rulesStatus: rule.status,
      uncertain,
    },
  };
}
