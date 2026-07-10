"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCompanyContext } from "@/lib/app/company";
import { maxCoveredCountries } from "@/lib/plans";
import { syncDeadlines } from "@/lib/app/deadlines-server";
import type { CompanyCountryRow, CompanyCountryStatus, CompanyRow } from "@/lib/app/types";

export interface OnboardingPayload {
  name: string;
  establishmentCountry: string;
  vatNumber: string;
  countries: { code: string; status: CompanyCountryStatus }[];
}

/**
 * Create the user's company + selling countries (onboarding, ARCHITECTURE.md §3),
 * then materialise deadlines for the reminder cron and land on the dashboard.
 * RLS scopes every write to the current user.
 */
export async function completeOnboarding(
  payload: OnboardingPayload,
): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unauthenticated" };

  // countries may be empty: a company selling only in not-yet-covered
  // countries still completes onboarding (the selection is captured as
  // interest client-side); the dashboard starts empty.
  const name = payload.name.trim();
  if (!name || !payload.establishmentCountry) {
    return { error: "invalid" };
  }

  // Server-side country cap (never UI-only): a new company starts on the free
  // plan, capped at 3 covered countries (lib/plans.ts — matches Essenziale).
  const maxCountries = maxCoveredCountries("free");
  if (maxCountries !== null && payload.countries.length > maxCountries) {
    return { error: "limit" };
  }

  // Guard against a double submit — never create a second company.
  if (await getCompanyContext()) redirect("/app");

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .insert({
      owner_id: user.id,
      name,
      establishment_country: payload.establishmentCountry,
      vat_number: payload.vatNumber.trim() || null,
    })
    .select()
    .single();
  if (companyError || !company) return { error: "save" };

  const rows = payload.countries.map((country) => ({
    company_id: company.id,
    country_code: country.code,
    status: country.status,
  }));
  if (rows.length > 0) {
    const { error: ccError } = await supabase.from("company_countries").insert(rows);
    if (ccError) return { error: "save" };
  }

  const { data: companyCountries } = await supabase
    .from("company_countries")
    .select("*")
    .eq("company_id", company.id);
  await syncDeadlines(company as CompanyRow, (companyCountries ?? []) as CompanyCountryRow[]);

  redirect("/app");
}
