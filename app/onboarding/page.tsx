import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCompanyContext, getUser, listCountries } from "@/lib/app/company";
import { OnboardingWizard, type WizardCountry } from "@/components/app/onboarding-wizard";
import { t } from "@/lib/i18n";

export const metadata: Metadata = {
  title: t("app.onboarding.eyebrow"),
  robots: { index: false, follow: false },
};

export default async function OnboardingPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  if (await getCompanyContext()) redirect("/app");

  const countries: WizardCountry[] = (await listCountries()).map((c) => ({
    code: c.code,
    name: c.name,
    registerName: c.register_name,
  }));

  return <OnboardingWizard countries={countries} />;
}
