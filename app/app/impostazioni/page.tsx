import Link from "next/link";

import { getCompanyContext, getUser } from "@/lib/app/company";
import { normalizePlan } from "@/lib/plans";
import { t } from "@/lib/i18n";
import { AppMain } from "@/components/app/app-main";
import { PageHeader } from "@/components/app/page-header";
import { SettingsForm } from "@/components/app/settings-form";
import { Button } from "@/components/ui/button";

export default async function SettingsPage() {
  const context = await getCompanyContext();
  if (!context) return null;
  const user = await getUser();
  const plan = normalizePlan(context.company.plan);

  return (
    <AppMain>
      <PageHeader
        eyebrow={t("app.settings.eyebrow")}
        title={t("app.settings.title")}
        subtitle={t("app.settings.subtitle")}
      />
      <SettingsForm
        email={user?.email ?? ""}
        initialName={context.company.name}
        initialEstablishment={context.company.establishment_country}
        initialVat={context.company.vat_number ?? ""}
      />
      {/* Billing lives on /app/piano (checkout + Customer Portal, ARCHITECTURE §2). */}
      <section className="mt-6 flex flex-col items-start gap-2 rounded-lg border border-line bg-surface px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div>
          <p className="eyebrow text-muted-foreground">{t("app.settings.planTitle")}</p>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {t("app.settings.planBody", { plan: t(`app.plan.names.${plan}`) })}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/app/piano">{t("app.settings.planCta")}</Link>
        </Button>
      </section>
    </AppMain>
  );
}
