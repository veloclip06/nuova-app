import { createClient } from "@/lib/supabase/server";
import { getCompanyContext } from "@/lib/app/company";
import { getSkusWithComponents } from "@/lib/app/products";
import { canAccessReports, canSeeReportHistory, normalizePlan } from "@/lib/plans";
import { loadAllRules } from "@/lib/rules/load";
import { t } from "@/lib/i18n";
import { AppMain } from "@/components/app/app-main";
import { PageHeader } from "@/components/app/page-header";
import { ReportClient } from "@/components/app/report-client";
import { ReportHistory, type ReportHistoryEntry } from "@/components/app/report-history";
import { UpgradeGate } from "@/components/app/upgrade-gate";
import type { SalesVolumeRow } from "@/lib/app/types";

export default async function ReportPage() {
  const context = await getCompanyContext();
  if (!context) return null;
  const { company, companyCountries } = context;
  const plan = normalizePlan(company.plan);

  // Free plan: dashboard yes, outputs no (ratified 2026-07-10) — the whole
  // report page renders the upgrade gate, no data fetches.
  if (!canAccessReports(plan)) {
    return (
      <AppMain>
        <PageHeader
          eyebrow={t("app.report.eyebrow")}
          title={t("app.report.title")}
          subtitle={t("app.report.subtitle")}
        />
        <UpgradeGate feature="report" />
      </AppMain>
    );
  }

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
  const history = canSeeReportHistory(plan);
  const [{ skus }, { data: volumeData }, { data: reportData }] = await Promise.all([
    getSkusWithComponents(company.id),
    supabase.from("sales_volumes").select("*").eq("company_id", company.id),
    // History is completo-only: the conditional fetch IS the server enforcement.
    history
      ? supabase
          .from("reports")
          .select("id, country_code, period, created_at")
          .eq("company_id", company.id)
          .order("created_at", { ascending: false })
          .limit(20)
      : Promise.resolve({ data: null }),
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
      {history ? (
        <ReportHistory
          entries={((reportData ?? []) as {
            id: string;
            country_code: string;
            period: string;
            created_at: string;
          }[]).map(
            (row): ReportHistoryEntry => ({
              id: row.id,
              countryName: ruleByCode.get(row.country_code)?.country_name ?? row.country_code,
              period: row.period,
              createdAt: row.created_at,
            }),
          )}
        />
      ) : (
        <div className="mt-8">
          <UpgradeGate feature="history" variant="inline" />
        </div>
      )}
    </AppMain>
  );
}
