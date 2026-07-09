import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { PackagingComponentRow, SkuRow } from "./types";

/**
 * Load the company's SKUs with their packaging components (RLS-scoped). Shared
 * by the products page and the report page (which feeds them to computeReport).
 */
export async function getSkusWithComponents(
  companyId: string,
): Promise<{ skus: SkuRow[]; components: PackagingComponentRow[] }> {
  const supabase = await createClient();
  const { data: skus } = await supabase
    .from("skus")
    .select("*")
    .eq("company_id", companyId)
    .order("sku_code");
  const skuRows = (skus ?? []) as SkuRow[];
  if (skuRows.length === 0) return { skus: [], components: [] };

  const { data: components } = await supabase
    .from("packaging_components")
    .select("*")
    .in(
      "sku_id",
      skuRows.map((s) => s.id),
    );
  return { skus: skuRows, components: (components ?? []) as PackagingComponentRow[] };
}
