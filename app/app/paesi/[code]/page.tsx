import Link from "next/link";
import { getCompanyContext } from "@/lib/app/company";
import { loadAllRules } from "@/lib/rules/load";
import { checkObligations } from "@/lib/engine/check-obligations";
import { generateDeadlines } from "@/lib/engine/generate-deadlines";
import { toCheckerInput, toCompanyProfile } from "@/lib/app/mappers";
import { dashboardSealFor, sealTone } from "@/lib/app/seal";
import { formatDateIt, todayInRome } from "@/lib/checker/format";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { AppMain } from "@/components/app/app-main";
import { StatusChanger } from "@/components/app/status-changer";
import { MonoDigits } from "@/components/mono-digits";
import { Flag } from "@/components/checker/flag";

/** Bordered "registro" block. `accent` flags the section with a semantic keyline
 * + tinted label — used only where there is real, present exposure (§3). */
function Section({
  title,
  accent,
  children,
}: {
  title: string;
  accent?: "risk" | "warn";
  children: React.ReactNode;
}) {
  return (
    <section
      className="rounded-lg border border-line bg-surface p-6"
      style={accent ? { borderLeftWidth: 3, borderLeftColor: `var(--${accent})` } : undefined}
    >
      <p
        className={cn(
          "eyebrow mb-4",
          accent === "risk" ? "text-risk" : accent === "warn" ? "text-warn" : "text-muted-foreground",
        )}
      >
        {title}
      </p>
      {children}
    </section>
  );
}

/** Draft-rule marker: a small "in verifica" stamp (§8.3), never a settled claim. */
function Uncertain({ when }: { when?: boolean }) {
  if (!when) return null;
  return (
    <span className="ml-1.5 inline-flex items-center rounded-sm border border-line px-1.5 py-px align-middle font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
      {t("app.country.inVerifica")}
    </span>
  );
}

export default async function CountryDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const countryCode = code.toUpperCase();

  const context = await getCompanyContext();
  if (!context) return null;
  const { company, companyCountries } = context;

  const companyCountry = companyCountries.find((c) => c.country_code === countryCode);
  const rules = loadAllRules().ok.map(({ rule }) => rule);
  const rule = rules.find((r) => r.country_code === countryCode);

  const backLink = (
    <Link href="/app" className="rounded-sm text-2xs text-brand hover:underline">
      ← {t("app.country.back")}
    </Link>
  );

  if (!companyCountry || !rule) {
    return (
      <AppMain>
        <div className="mb-6">{backLink}</div>
        <div className="rounded-lg border border-line bg-surface p-8 text-base text-muted-foreground">
          {t("app.country.notCovered")}
        </div>
      </AppMain>
    );
  }

  const referenceDate = todayInRome();
  const obligations = checkObligations(
    toCheckerInput(company, companyCountries, referenceDate),
    rules,
  );
  const obligation = obligations.find((o) => o.countryCode === countryCode);
  if (!obligation) {
    return (
      <AppMain>
        <div className="mb-6">{backLink}</div>
        <div className="rounded-lg border border-line bg-surface p-8 text-base text-muted-foreground">
          {t("app.country.notCovered")}
        </div>
      </AppMain>
    );
  }

  const countryDeadlines = generateDeadlines(
    toCompanyProfile(company, companyCountries),
    rules,
    { referenceDate },
  ).filter((d) => d.countryCode === countryCode);

  const cost = obligation.register.costRegistration;
  const costLabel =
    cost === null
      ? t("app.country.costUnknown")
      : cost === 0
        ? t("app.country.costFree")
        : `${cost} €`;

  // Current legal standing → the Sanzioni accent (semantic only: red = ESPOSTO,
  // amber = AZIONE RICHIESTA, none when compliant). Reflects the saved status;
  // the server action revalidates this path after the status-changer saves.
  const seal = dashboardSealFor(obligation, companyCountry.status);
  const tone = sealTone(seal);
  const penaltiesAccent = tone === "risk" ? "risk" : tone === "warn" ? "warn" : undefined;

  return (
    <AppMain>
      <div className="mb-6">{backLink}</div>

      <header className="mb-8 flex items-center gap-3">
        <Flag code={countryCode} size="md" />
        <div className="min-w-0">
          <p className="font-display text-2xs font-semibold uppercase tracking-register text-muted-foreground">
            {obligation.register.name}
          </p>
          <h1 className="font-display text-2xl font-bold tracking-tightDisplay text-ink">
            {obligation.countryName}
          </h1>
        </div>
        <span className="ml-auto self-start rounded-sm border border-line px-2 py-1 font-mono text-2xs font-semibold tracking-wider text-muted-foreground">
          {countryCode}
        </span>
      </header>

      <div className="flex flex-col gap-5">
        {/* Status */}
        <Section title={t("app.country.statusTitle")}>
          {obligation.obligated ? (
            <>
              <StatusChanger
                code={countryCode}
                obligated={obligation.obligated}
                domestic={obligation.domestic}
                initialStatus={companyCountry.status}
              />
              <p className="mt-4 text-2xs text-muted-foreground">{t("app.country.statusHelp")}</p>
            </>
          ) : (
            <div>
              <p className="font-display text-base font-semibold text-ink">
                {t("app.country.notObligatedTitle")}
              </p>
              <p className="mt-2 max-w-prose text-base leading-relaxed text-muted-foreground">
                {t("app.country.notObligatedBody")}
              </p>
            </div>
          )}
        </Section>

        {/* Register */}
        <Section title={t("app.country.registerTitle")}>
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-2xs text-muted-foreground">{t("app.country.authorityLabel")}</dt>
              <dd className="text-xs text-ink">{obligation.register.authority}</dd>
            </div>
            <div>
              <dt className="text-2xs text-muted-foreground">{t("app.country.portalLabel")}</dt>
              <dd>
                <a
                  href={obligation.register.portalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all font-mono text-2xs text-brand hover:underline"
                >
                  {obligation.register.portalUrl}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-2xs text-muted-foreground">{t("app.country.costLabel")}</dt>
              <dd className="font-mono text-xs text-ink">
                {costLabel}
                <Uncertain when={obligation.register.uncertain} />
              </dd>
            </div>
            <div>
              <dt className="text-2xs text-muted-foreground">{t("app.country.languagesLabel")}</dt>
              <dd className="font-mono text-xs uppercase text-ink">
                {rule.register.languages.join(" · ")}
              </dd>
            </div>
          </dl>
        </Section>

        {/* Requirements */}
        {obligation.obligated && obligation.requirements.length > 0 && (
          <Section title={t("app.country.requirementsTitle")}>
            <ol className="flex flex-col gap-3">
              {obligation.requirements.map((req) => (
                <li key={req.id} className="max-w-prose text-xs leading-relaxed text-ink">
                  <span className="font-medium">{req.label}</span> — <MonoDigits text={req.when} />
                  <Uncertain when={req.uncertain} />
                  {req.note && (
                    <span className="mt-0.5 block text-2xs text-muted-foreground">
                      <MonoDigits text={req.note} />
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </Section>
        )}

        {/* Deadlines */}
        {obligation.obligated && (
          <Section title={t("app.country.deadlinesTitle")}>
            {countryDeadlines.length > 0 ? (
              <ul className="flex flex-col gap-3">
                {countryDeadlines.map((deadline, index) => (
                  <li
                    key={`${deadline.kind}-${deadline.dueDate ?? deadline.sourceKind}-${index}`}
                    className="flex flex-wrap items-baseline gap-x-3 gap-y-1"
                  >
                    <span className="min-w-[92px] font-mono text-2xs font-semibold text-ink">
                      {deadline.dueDate
                        ? formatDateIt(deadline.dueDate)
                        : t("app.dashboard.deadlines.undated")}
                    </span>
                    <span className="flex-1 text-xs leading-relaxed text-ink">
                      {deadline.label ? `${deadline.label} — ` : ""}
                      <MonoDigits text={deadline.ruleText} />
                      <Uncertain when={deadline.uncertain} />
                      {deadline.conditional && deadline.conditionNote && (
                        <span className="mt-0.5 block text-2xs text-muted-foreground">
                          <MonoDigits text={deadline.conditionNote} />
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="max-w-prose text-base leading-relaxed text-muted-foreground">
                {t("app.country.noDeadlines")}
              </p>
            )}
          </Section>
        )}

        {/* Penalties + AR */}
        {obligation.obligated && (
          <Section title={t("app.country.penaltiesTitle")} accent={penaltiesAccent}>
            {penaltiesAccent && (
              <p
                className={cn(
                  "mb-3 text-2xs font-medium",
                  penaltiesAccent === "risk" ? "text-risk" : "text-warn",
                )}
              >
                {t(`app.country.penaltiesStanding.${seal}`)}
              </p>
            )}
            <p className="max-w-prose text-xs leading-relaxed text-ink">
              <MonoDigits text={obligation.penalties.summary} />
              <Uncertain when={obligation.penalties.uncertain} /> ·{" "}
              <a
                href={obligation.penalties.detailUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand hover:underline"
              >
                {t("app.country.penaltiesDetail")}
              </a>
            </p>
            {obligation.authorisedRepresentative && (
              <div className="mt-4 border-t border-line pt-4">
                <p className="text-2xs text-muted-foreground">{t("app.country.arTitle")}</p>
                <p className="mt-1 max-w-prose text-xs leading-relaxed text-ink">
                  <MonoDigits text={obligation.authorisedRepresentative.notes} />
                  <Uncertain when={obligation.authorisedRepresentative.uncertain} />
                </p>
              </div>
            )}
          </Section>
        )}

        {/* Sources */}
        <Section title={t("app.country.sourcesTitle")}>
          <ul className="flex flex-col gap-2">
            {obligation.sources.map((source) => (
              <li key={source.url} className="text-2xs text-muted-foreground">
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand hover:underline"
                >
                  {source.title}
                </a>{" "}
                · {t("app.country.sourceAccessed")}{" "}
                <span className="font-mono">{formatDateIt(source.accessed)}</span>
              </li>
            ))}
          </ul>
          {!obligation.lastVerifiedByHuman && (
            <p className="mt-4 text-2xs text-muted-foreground">{t("app.country.draftNotice")}</p>
          )}
        </Section>
      </div>
    </AppMain>
  );
}
