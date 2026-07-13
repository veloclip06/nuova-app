import Link from "next/link";
import { getCompanyContext } from "@/lib/app/company";
import { loadAllRules } from "@/lib/rules/load";
import { checkObligations } from "@/lib/engine/check-obligations";
import { toCheckerInput } from "@/lib/app/mappers";
import { dashboardSealFor } from "@/lib/app/seal";
import { todayInRome } from "@/lib/checker/format";
import { t } from "@/lib/i18n";
import { AppMain } from "@/components/app/app-main";
import { PageHeader } from "@/components/app/page-header";
import { CountryCard } from "@/components/app/country-card";
import { MonoDigits } from "@/components/mono-digits";
import { Button } from "@/components/ui/button";
import type { SealStatus } from "@/components/seal";

const TILTS = [-1.6, -1.2, -2, -0.8, -1.4, -1.8];

/** Census reading order: worst-first as a legend, not as card order (cards stay alphabetical). */
const TALLY_ORDER: SealStatus[] = ["esposto", "azione_richiesta", "conforme", "non_obbligato"];

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
    )
    // The countries list is the full registry: a stable alphabetical order (not the
    // dashboard's triage glance) is what makes it an inventory, not a duplicate.
    .sort((a, b) => a.obligation.countryName.localeCompare(b.obligation.countryName, "it"));

  // Per-seal census: doubles as the legend for the stamps below.
  const sealCounts = cards.reduce<Record<SealStatus, number>>(
    (acc, card) => {
      const seal = dashboardSealFor(card.obligation, card.status);
      acc[seal] += 1;
      return acc;
    },
    { conforme: 0, azione_richiesta: 0, esposto: 0, non_obbligato: 0 },
  );
  const total = cards.length;
  const tallyLine = [
    total === 1 ? t("app.paesi.tally.totalOne") : t("app.paesi.tally.total", { count: total }),
    ...TALLY_ORDER.filter((seal) => sealCounts[seal] > 0).map(
      (seal) => `${sealCounts[seal]} ${t(`app.paesi.tally.${seal}`)}`,
    ),
  ].join("  ·  ");

  return (
    <AppMain>
      <PageHeader
        eyebrow={t("app.paesi.eyebrow")}
        title={t("app.paesi.title")}
        subtitle={t("app.paesi.subtitle")}
      />
      {total > 0 && (
        <div className="mb-8 rounded-lg border border-line bg-surface px-5 py-3">
          <p className="font-display text-2xs font-semibold uppercase tracking-register text-ink">
            <MonoDigits text={tallyLine} />
          </p>
        </div>
      )}
      {cards.length > 0 ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(270px,1fr))] gap-5">
          {cards.map((card, index) => (
            <CountryCard
              key={card.obligation.countryCode}
              obligation={card.obligation}
              status={card.status}
              tilt={TILTS[index % TILTS.length]}
            />
          ))}
        </div>
      ) : companyCountries.length > 0 ? (
        // Covered countries always come with a rule, so no cards here means the
        // rules failed to load — not that the countries are uncovered.
        <div className="rounded-lg border border-line bg-surface p-8">
          <p className="max-w-prose text-base text-muted-foreground">
            {t("app.dashboard.empty.noRules")}
          </p>
        </div>
      ) : (
        // No company_countries rows: only covered countries are persisted, so this
        // is the "interest only" case — same onboarding-as-empty-state as the dashboard.
        <div className="flex flex-col items-start gap-3 rounded-lg border border-line bg-surface p-8">
          <h2 className="font-display text-lg font-semibold text-ink">
            {t("app.dashboard.empty.title")}
          </h2>
          <p className="max-w-prose text-base text-muted-foreground">
            {t("app.dashboard.empty.body")}
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href="/app/impostazioni">{t("app.dashboard.empty.cta")}</Link>
          </Button>
        </div>
      )}
    </AppMain>
  );
}
