import { getCompanyContext, getUser } from "@/lib/app/company";
import { t } from "@/lib/i18n";
import { AppMain } from "@/components/app/app-main";
import { PageHeader } from "@/components/app/page-header";
import { SettingsForm } from "@/components/app/settings-form";

export default async function SettingsPage() {
  const context = await getCompanyContext();
  if (!context) return null;
  const user = await getUser();

  return (
    <AppMain>
      <PageHeader eyebrow={t("app.settings.eyebrow")} title={t("app.settings.title")} />
      <SettingsForm
        email={user?.email ?? ""}
        initialName={context.company.name}
        initialEstablishment={context.company.establishment_country}
        initialVat={context.company.vat_number ?? ""}
      />
    </AppMain>
  );
}
