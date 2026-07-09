import { getCompanyContext } from "@/lib/app/company";
import { loadAllRules } from "@/lib/rules/load";
import { checkObligations } from "@/lib/engine/check-obligations";
import { toCheckerInput } from "@/lib/app/mappers";
import { todayInRome } from "@/lib/checker/format";
import { t } from "@/lib/i18n";
import { AppMain } from "@/components/app/app-main";
import { PageHeader } from "@/components/app/page-header";
import { CountryCard } from "@/components/app/country-card";

const TILTS = [-1.6, -1.2, -2, -0.8, -1.4, -1.8];

export default async function PaesiPage() {
  const context = await getCompanyContext();
  if (!context) return null;
  const { company, companyCountries } = context;

  const referenceDate = todayInRome();
  const rules = loadAllRules().ok.map(({ rule }) => rule);
  const obligations = checkObligations(
    toCheckerInput(company, companyCountries, referenceDate),
    rules,
  );
  const obligationByCode = new Map(obligations.map((o) => [o.countryCode, o]));

  const cards = companyCountries
    .map((c) => ({ obligation: obligationByCode.get(c.country_code), status: c.status }))
    .filter((card): card is { obligation: NonNullable<typeof card.obligation>; status: typeof card.status } =>
      Boolean(card.obligation),
    );

  return (
    <AppMain>
      <PageHeader
        eyebrow={t("app.paesi.eyebrow")}
        title={t("app.paesi.title")}
        subtitle={t("app.paesi.subtitle")}
      />
      {cards.length > 0 ? (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(270px,1fr))] gap-5">
          {cards.map((card, index) => (
            <CountryCard
              key={card.obligation.countryCode}
              obligation={card.obligation}
              status={card.status}
              tilt={TILTS[index % TILTS.length]}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-line bg-surface p-8 text-base text-muted-foreground">
          {t("app.dashboard.empty.body")}
        </div>
      )}
    </AppMain>
  );
}
