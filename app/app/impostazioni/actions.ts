"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCompanyContext } from "@/lib/app/company";
import { syncDeadlines } from "@/lib/app/deadlines-server";

export interface UpdateCompanyInput {
  name: string;
  establishmentCountry: string;
  vatNumber: string;
}

/** Edit the company profile. Establishment changes can flip domestic/foreign, so
 * deadlines are re-materialised afterwards (best-effort). */
export async function updateCompany(input: UpdateCompanyInput): Promise<{ error?: string }> {
  const context = await getCompanyContext();
  if (!context) return { error: "unauthenticated" };

  const name = input.name.trim();
  if (!name || !input.establishmentCountry) return { error: "invalid" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("companies")
    .update({
      name,
      establishment_country: input.establishmentCountry,
      vat_number: input.vatNumber.trim() || null,
    })
    .eq("id", context.company.id);
  if (error) return { error: "save" };

  await syncDeadlines(
    { ...context.company, name, establishment_country: input.establishmentCountry },
    context.companyCountries,
  );

  revalidatePath("/app");
  revalidatePath("/app/impostazioni");
  return {};
}
