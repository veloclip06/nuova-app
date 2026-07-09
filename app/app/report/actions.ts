"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCompanyContext } from "@/lib/app/company";
import { getSkusWithComponents } from "@/lib/app/products";
import { toSkuInputs } from "@/lib/app/mappers";
import { loadAllRules } from "@/lib/rules/load";
import { computeReport } from "@/lib/engine/compute-report";
import type { MaterialBreakdown, VolumeInput } from "@/lib/engine/types";

export interface GenerateReportInput {
  countryCode: string;
  period: string;
  volumes: { skuId: string; units: number }[];
}

export type ReportActionResult =
  | { ok: true; report: MaterialBreakdown }
  | { ok: false; errors: { code: string; skuCode?: string; message: string }[] };

/**
 * Persist the entered volumes, run computeReport for one country+period, and
 * save a successful report to history (ARCHITECTURE.md §4). Volumes are stored
 * so the report screen prefills them next time (self-contained UX). Nothing is
 * ever a partial/wrong report — data problems return `ok: false` with every
 * actionable error (the engine's contract).
 */
export async function generateReport(input: GenerateReportInput): Promise<ReportActionResult> {
  const context = await getCompanyContext();
  if (!context) return { ok: false, errors: [{ code: "generic", message: "unauthenticated" }] };

  const countryCode = input.countryCode.toUpperCase();
  if (!context.companyCountries.some((c) => c.country_code === countryCode)) {
    return { ok: false, errors: [{ code: "generic", message: "country not selected" }] };
  }

  const rule = loadAllRules().ok.map(({ rule }) => rule).find((r) => r.country_code === countryCode);
  if (!rule) return { ok: false, errors: [{ code: "generic", message: "country not covered" }] };

  const supabase = await createClient();
  const { skus, components } = await getSkusWithComponents(context.company.id);
  const skuById = new Map(skus.map((s) => [s.id, s]));

  // Persist entered volumes (upsert on the unique key) so they prefill later.
  const volumeRows = input.volumes
    .filter((v) => skuById.has(v.skuId) && Number.isInteger(v.units) && v.units >= 0)
    .map((v) => ({
      company_id: context.company.id,
      sku_id: v.skuId,
      country_code: countryCode,
      period: input.period,
      units: v.units,
    }));
  if (volumeRows.length > 0) {
    await supabase
      .from("sales_volumes")
      .upsert(volumeRows, { onConflict: "company_id,sku_id,country_code,period" });
  }

  const volumes: VolumeInput[] = input.volumes
    .map((v) => {
      const sku = skuById.get(v.skuId);
      return sku ? { skuCode: sku.sku_code, units: v.units } : null;
    })
    .filter((v): v is VolumeInput => v !== null && Number.isInteger(v.units) && v.units > 0);

  const result = computeReport({
    rule,
    period: input.period,
    skus: toSkuInputs(skus, components),
    volumes,
  });

  if (!result.ok) {
    return { ok: false, errors: result.errors };
  }

  // Save successful report to history.
  await supabase.from("reports").insert({
    company_id: context.company.id,
    country_code: countryCode,
    period: input.period,
    payload: result.report,
  });
  revalidatePath("/app");

  return { ok: true, report: result.report };
}
