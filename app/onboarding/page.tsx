import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCompanyContext, getUser, listCountries } from "@/lib/app/company";
import { OnboardingWizard } from "@/components/app/onboarding-wizard";
import { t } from "@/lib/i18n";

export const metadata: Metadata = {
  title: t("app.onboarding.eyebrow"),
  robots: { index: false, follow: false },
};

export default async function OnboardingPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  if (await getCompanyContext()) redirect("/app");

  // Covered = the countries table, seeded from /rules (npm run seed-rules) —
  // the persistable set. The wizard shows all 27 EU states regardless.
  const covered = (await listCountries()).map((c) => c.code);

  return <OnboardingWizard covered={covered} />;
}
