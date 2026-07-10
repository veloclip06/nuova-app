import { createClient } from "@/lib/supabase/server";
import { getCompanyContext } from "@/lib/app/company";
import { getSkusWithComponents } from "@/lib/app/products";
import { loadAllRules } from "@/lib/rules/load";
import { t } from "@/lib/i18n";
import { AppMain } from "@/components/app/app-main";
import { PageHeader } from "@/components/app/page-header";
import { ReportClient } from "@/components/app/report-client";
import type { SalesVolumeRow } from "@/lib/app/types";

export default async function ReportPage() {
  const context = await getCompanyContext();
  if (!context) return null;
  const { company, companyCountries } = context;

  const rules = loadAllRules().ok.map(({ rule }) => rule);
  const ruleByCode = new Map(rules.map((r) => [r.country_code, r]));

  const countries = companyCountries
    .map((c) => ruleByCode.get(c.country_code))
    .filter((rule): rule is NonNullable<typeof rule> => Boolean(rule))
    .map((rule) => ({
      code: rule.country_code,
      name: rule.country_name,
      registerName: rule.register.name,
    }));

  const supabase = await createClient();
  const [{ skus }, { data: volumeData }] = await Promise.all([
    getSkusWithComponents(company.id),
    supabase.from("sales_volumes").select("*").eq("company_id", company.id),
  ]);
  const skuList = skus.map((sku) => ({ id: sku.id, skuCode: sku.sku_code, name: sku.name }));
  const volumes = ((volumeData ?? []) as SalesVolumeRow[]).map((v) => ({
    skuId: v.sku_id,
    countryCode: v.country_code,
    period: v.period,
    units: v.units,
  }));

  return (
    <AppMain>
      <PageHeader
        eyebrow={t("app.report.eyebrow")}
        title={t("app.report.title")}
        subtitle={t("app.report.subtitle")}
      />
      <ReportClient countries={countries} skus={skuList} volumes={volumes} />
    </AppMain>
  );
}
