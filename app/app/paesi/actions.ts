"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCompanyContext } from "@/lib/app/company";
import { syncDeadlines } from "@/lib/app/deadlines-server";
import type { CompanyCountryStatus } from "@/lib/app/types";

const VALID_STATUS: CompanyCountryStatus[] = ["not_registered", "in_progress", "registered"];

/**
 * Update the company's registration status for one country, then re-materialise
 * its deadlines (ARCHITECTURE.md §7). The seal turning CONFORME is the product's
 * emotional reward (DESIGN_SYSTEM.md §5). RLS scopes the update to the owner.
 */
export async function updateCountryStatus(
  code: string,
  status: CompanyCountryStatus,
): Promise<{ error?: string }> {
  if (!VALID_STATUS.includes(status)) return { error: "invalid" };

  const context = await getCompanyContext();
  if (!context) return { error: "unauthenticated" };

  const countryCode = code.toUpperCase();
  const supabase = await createClient();
  const { error } = await supabase
    .from("company_countries")
    .update({ status })
    .eq("company_id", context.company.id)
    .eq("country_code", countryCode);
  if (error) return { error: "save" };

  const updated = context.companyCountries.map((c) =>
    c.country_code === countryCode ? { ...c, status } : c,
  );
  await syncDeadlines(context.company, updated);

  revalidatePath("/app");
  revalidatePath("/app/paesi");
  revalidatePath(`/app/paesi/${code.toLowerCase()}`);
  return {};
}
