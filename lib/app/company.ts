import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { CompanyCountryRow, CompanyRow, CountryRow } from "./types";

/**
 * Server-side reads for the authenticated app area. RLS scopes every table to
 * `owner_id = auth.uid()` (ARCHITECTURE.md §3), so these queries only ever
 * return the current user's own company data.
 */

export interface CompanyContext {
  company: CompanyRow;
  companyCountries: CompanyCountryRow[];
}

/** The authenticated user, or null. */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * The current user's company + its selling countries, or null when the user is
 * not authenticated or has not completed onboarding yet (1 user = 1 company).
 */
export async function getCompanyContext(): Promise<CompanyContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: company } = await supabase
    .from("companies")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!company) return null;

  const { data: companyCountries } = await supabase
    .from("company_countries")
    .select("*")
    .eq("company_id", company.id);

  return {
    company: company as CompanyRow,
    companyCountries: (companyCountries ?? []) as CompanyCountryRow[],
  };
}

/** Public reference countries seeded from /rules (npm run seed-rules). */
export async function listCountries(): Promise<CountryRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("countries").select("*").order("name");
  return (data ?? []) as CountryRow[];
}
