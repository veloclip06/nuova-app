import Link from "next/link";
import { getCompanyContext } from "@/lib/app/company";
import { loadAllRules } from "@/lib/rules/load";
import { checkObligations } from "@/lib/engine/check-obligations";
import { generateDeadlines } from "@/lib/engine/generate-deadlines";
import { toCheckerInput, toCompanyProfile } from "@/lib/app/mappers";
import { dashboardSealFor, isConfigured, sealTone } from "@/lib/app/seal";
import { todayInRome } from "@/lib/checker/format";
import { t } from "@/lib/i18n";
import { AppMain } from "@/components/app/app-main";
import { PageHeader } from "@/components/app/page-header";
import { CountryCard } from "@/components/app/country-card";
import { DeadlinesList, type DeadlineListItem } from "@/components/app/deadlines-list";
import { Button } from "@/components/ui/button";

/** Slight per-card seal rotation for the hand-stamped look (dashboard export). */
const TILTS = [-1.6, -1.2, -2, -0.8, -1.4, -1.8];

/** Digits in mono — "i numeri sono il prodotto" (DESIGN_SYSTEM.md §4). */
function MonoNumbers({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\d+)/).map((part, i) =>
        /^\d+$/.test(part) ? (
          <span key={i} className="font-mono font-semibold">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
}

export default async function DashboardPage() {
  const context = await getCompanyContext();
  if (!context) return null; // /app layout guards; keeps types happy
  const { company, companyCountries } = context;

  const referenceDate = todayInRome();
  const rules = loadAllRules().ok.map(({ rule }) => rule);

  const obligations = checkObligations(
    toCheckerInput(company, companyCountries, referenceDate),
    rules,
  );
  const obligationByCode = new Map(obligations.map((o) => [o.countryCode, o]));

  const total = companyCountries.length;
  const configuredCount = companyCountries.filter((c) => isConfigured(c.status)).length;
  const firstUnconfigured = companyCountries.find((c) => !isConfigured(c.status));
  const firstUnconfiguredName = firstUnconfigured
    ? (obligationByCode.get(firstUnconfigured.country_code)?.countryName ??
      t(`countries.${firstUnconfigured.country_code}`))
    : null;
  const progressPct = total > 0 ? Math.round((configuredCount / total) * 100) : 0;

  const deadlines = generateDeadlines(toCompanyProfile(company, companyCountries), rules, {
    referenceDate,
  });
  const sealByCode = new Map(
    companyCountries.map((c) => {
      const obligation = obligationByCode.get(c.country_code);
      return [c.country_code, obligation ? dashboardSealFor(obligation, c.status) : "non_obbligato"] as const;
    }),
  );
  const deadlineItems: DeadlineListItem[] = deadlines.slice(0, 6).map((deadline, index) => {
    const seal = sealByCode.get(deadline.countryCode) ?? "non_obbligato";
    return {
      key: `${deadline.countryCode}-${deadline.kind}-${deadline.dueDate ?? deadline.sourceKind}-${index}`,
      date: deadline.dueDate,
      countryName:
        obligationByCode.get(deadline.countryCode)?.countryName ?? t(`countries.${deadline.countryCode}`),
      description: deadline.label ?? deadline.ruleText,
      tone: sealTone(seal),
      pillLabel: t(`app.dashboard.deadlines.${seal}`),
    };
  });

  const cards = companyCountries
    .map((c) => ({ obligation: obligationByCode.get(c.country_code), status: c.status }))
    .filter((card): card is { obligation: NonNullable<typeof card.obligation>; status: typeof card.status } =>
      Boolean(card.obligation),
    );

  return (
    <AppMain>
      <PageHeader eyebrow={company.name} title={t("app.dashboard.title")} />

      {total > 0 && (
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-line bg-surface px-5 py-4">
          <div className="min-w-[240px] flex-1">
            <p className="text-xs text-ink">
              <MonoNumbers
                text={t("app.dashboard.banner.progress", { done: configuredCount, total })}
              />
            </p>
            <div className="mt-2 h-1.5 max-w-[320px] overflow-hidden rounded-full bg-line">
              <div className="h-full rounded-full bg-brand" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
          {firstUnconfigured && firstUnconfiguredName ? (
            <Link
              href={`/app/paesi/${firstUnconfigured.country_code.toLowerCase()}`}
              className="rounded-sm font-display text-xs font-semibold text-brand hover:text-brand-hover hover:underline"
            >
              {t("app.dashboard.banner.complete", { country: firstUnconfiguredName })} →
            </Link>
          ) : (
            <span className="text-2xs text-muted-foreground">{t("app.dashboard.banner.allDone")}</span>
          )}
        </div>
      )}

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

      <section className="mt-9">
        <p className="eyebrow mb-3 text-muted-foreground">{t("app.dashboard.deadlines.title")}</p>
        {deadlineItems.length > 0 ? (
          <DeadlinesList items={deadlineItems} />
        ) : (
          <div className="rounded-lg border border-line bg-surface p-6 text-base text-muted-foreground">
            {t("app.dashboard.deadlines.empty")}
          </div>
        )}
      </section>
    </AppMain>
  );
}
