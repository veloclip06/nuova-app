import { getCompanyContext } from "@/lib/app/company";
import { normalizePlan } from "@/lib/plans";
import { t } from "@/lib/i18n";
import { AppMain } from "@/components/app/app-main";
import { PageHeader } from "@/components/app/page-header";
import { PianoClient } from "@/components/app/piano-client";

/**
 * Plan / upgrade page — the only place a purchase starts (ratified 2026-07-10:
 * account first, then checkout; landing and /prezzi CTAs keep pointing at
 * /registrati). Subscribed companies get the Customer Portal link instead.
 */
export default async function PianoPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const context = await getCompanyContext();
  if (!context) return null;

  const { checkout } = await searchParams;
  const checkoutStatus =
    checkout === "success" ? "success" : checkout === "cancelled" ? "cancelled" : null;

  return (
    <AppMain>
      <PageHeader
        eyebrow={t("app.plan.eyebrow")}
        title={t("app.plan.title")}
        subtitle={t("app.plan.subtitle")}
      />
      <PianoClient plan={normalizePlan(context.company.plan)} checkoutStatus={checkoutStatus} />
    </AppMain>
  );
}
