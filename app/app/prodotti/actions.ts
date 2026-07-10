"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCompanyContext } from "@/lib/app/company";
import { canImportCsv, normalizePlan } from "@/lib/plans";
import { CANONICAL_MATERIALS, type CanonicalMaterial } from "@/lib/rules/schema";

interface ComponentInput {
  material: string;
  weightGrams: number;
}

export interface CreateProductInput {
  skuCode: string;
  name: string;
  components: ComponentInput[];
}

export interface ImportSkuInput {
  skuCode: string;
  name: string | null;
  components: ComponentInput[];
}

/** Keep only canonical materials with a finite, non-negative weight. */
function validComponents(components: ComponentInput[]): { material: CanonicalMaterial; weightGrams: number }[] {
  return components
    .filter(
      (c) =>
        (CANONICAL_MATERIALS as readonly string[]).includes(c.material) &&
        Number.isFinite(c.weightGrams) &&
        c.weightGrams >= 0,
    )
    .map((c) => ({ material: c.material as CanonicalMaterial, weightGrams: c.weightGrams }));
}

export async function createProduct(input: CreateProductInput): Promise<{ error?: string }> {
  const context = await getCompanyContext();
  if (!context) return { error: "unauthenticated" };

  const skuCode = input.skuCode.trim();
  if (!skuCode) return { error: "sku" };
  const components = validComponents(input.components);
  if (components.length === 0) return { error: "components" };

  const supabase = await createClient();
  const { data: sku, error: skuError } = await supabase
    .from("skus")
    .insert({
      company_id: context.company.id,
      sku_code: skuCode,
      name: input.name.trim() || null,
      source: "manual",
    })
    .select()
    .single();
  if (skuError || !sku) {
    if (skuError?.code === "23505") return { error: "duplicate" };
    return { error: "save" };
  }

  const { error: compError } = await supabase.from("packaging_components").insert(
    components.map((c) => ({ sku_id: sku.id, material: c.material, weight_grams: c.weightGrams })),
  );
  if (compError) return { error: "save" };

  revalidatePath("/app/prodotti");
  return {};
}

export async function deleteProduct(skuId: string): Promise<{ error?: string }> {
  const context = await getCompanyContext();
  if (!context) return { error: "unauthenticated" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("skus")
    .delete()
    .eq("id", skuId)
    .eq("company_id", context.company.id);
  if (error) return { error: "save" };

  revalidatePath("/app/prodotti");
  return {};
}

/**
 * Bulk import from CSV: upsert SKUs (source=csv) and replace their components,
 * so a re-import is idempotent per SKU. Three round-trips regardless of size.
 */
export async function importProducts(
  skus: ImportSkuInput[],
): Promise<{ imported: number; error?: string }> {
  const context = await getCompanyContext();
  if (!context) return { imported: 0, error: "unauthenticated" };

  // Server-side plan gate (never UI-only): CSV import is completo-only.
  if (!canImportCsv(normalizePlan(context.company.plan))) {
    return { imported: 0, error: "plan" };
  }
  const companyId = context.company.id;

  const clean = skus
    .map((s) => ({
      skuCode: s.skuCode.trim(),
      name: s.name?.trim() || null,
      components: validComponents(s.components),
    }))
    .filter((s) => s.skuCode && s.components.length > 0);
  if (clean.length === 0) return { imported: 0, error: "novalid" };

  const supabase = await createClient();
  const { data: upserted, error: upsertError } = await supabase
    .from("skus")
    .upsert(
      clean.map((s) => ({ company_id: companyId, sku_code: s.skuCode, name: s.name, source: "csv" })),
      { onConflict: "company_id,sku_code" },
    )
    .select();
  if (upsertError || !upserted) return { imported: 0, error: "save" };

  const idByCode = new Map(upserted.map((row) => [row.sku_code, row.id]));
  const skuIds = [...idByCode.values()];
  await supabase.from("packaging_components").delete().in("sku_id", skuIds);

  const componentRows = clean.flatMap((s) => {
    const skuId = idByCode.get(s.skuCode);
    if (!skuId) return [];
    return s.components.map((c) => ({ sku_id: skuId, material: c.material, weight_grams: c.weightGrams }));
  });
  if (componentRows.length > 0) {
    const { error: compError } = await supabase.from("packaging_components").insert(componentRows);
    if (compError) return { imported: 0, error: "save" };
  }

  revalidatePath("/app/prodotti");
  return { imported: clean.length };
}
