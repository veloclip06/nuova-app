"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { EU_COUNTRIES, EXTRA_EU } from "@/lib/checker/options";
import { capture } from "@/lib/analytics/capture";
import { EVENTS } from "@/lib/analytics/events";
import { canAddCoveredCountry } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { OptionCard } from "@/components/checker/option-card";
import { Flag } from "@/components/checker/flag";
import { completeOnboarding } from "@/app/onboarding/actions";
import type { CompanyCountryStatus } from "@/lib/app/types";

const STATUS_ORDER: CompanyCountryStatus[] = ["not_registered", "in_progress", "registered"];
const TOTAL_STEPS = 3;

/**
 * Post-signup onboarding (PROMPT 5): crea azienda → seleziona paesi → primo
 * stato. One decision per screen with endowed progress (DESIGN_SYSTEM.md §8.1-2).
 *
 * Country selection shows all 27 EU states in one uniform grid — coverage is
 * data, not layout. Only covered countries (`covered`, seeded from /rules) are
 * persisted; the others fire onboarding_interest_countries, the demand signal
 * that decides the next country to cover.
 */
export function OnboardingWizard({ covered }: { covered: string[] }) {
  const [step, setStep] = React.useState(1);
  const [name, setName] = React.useState("");
  const [establishment, setEstablishment] = React.useState("");
  const [vat, setVat] = React.useState("");
  const [selected, setSelected] = React.useState<string[]>([]);
  const [statusByCode, setStatusByCode] = React.useState<Record<string, CompanyCountryStatus>>({});
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const [limitHit, setLimitHit] = React.useState(false);

  // One uniform 27-country list for establishment and selling — no country is
  // visually privileged (coverage is data, not layout).
  const euOptions = React.useMemo(
    () =>
      [...EU_COUNTRIES].sort((a, b) =>
        t(`countries.${a}`).localeCompare(t(`countries.${b}`), "it"),
      ),
    [],
  );

  const coveredSelected = selected.filter((code) => covered.includes(code));
  const interestSelected = selected.filter((code) => !covered.includes(code));
  const coveredNames = React.useMemo(
    () =>
      covered
        .map((code) => t(`countries.${code}`))
        .sort((a, b) => a.localeCompare(b, "it")),
    [covered],
  );

  const canContinue =
    step === 1 ? name.trim() !== "" && establishment !== "" : step === 2 ? selected.length > 0 : true;

  function toggleCountry(code: string) {
    // Covered countries are capped at 3 during onboarding (everyone is on the
    // free plan here; the cap matches Essenziale — lib/plans.ts). Interest-only
    // countries stay uncapped: they never create company_countries rows.
    if (
      !selected.includes(code) &&
      covered.includes(code) &&
      !canAddCoveredCountry("free", coveredSelected.length)
    ) {
      setLimitHit(true);
      return;
    }
    setLimitHit(false);
    setSelected((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
    setStatusByCode((prev) => (prev[code] ? prev : { ...prev, [code]: "not_registered" }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canContinue) return;
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
      return;
    }
    setPending(true);
    setError(null);
    // Fire before the action: on success it redirects and never returns here.
    if (interestSelected.length > 0) {
      capture(EVENTS.onboardingInterest, { countries: interestSelected });
    }
    const result = await completeOnboarding({
      name,
      establishmentCountry: establishment,
      vatNumber: vat,
      countries: coveredSelected.map((code) => ({
        code,
        status: statusByCode[code] ?? "not_registered",
      })),
    });
    // On success the action redirects; only errors return here.
    if (result?.error) {
      setError(
        t(result.error === "limit" ? "app.onboarding.errorLimit" : "app.onboarding.error"),
      );
      setPending(false);
    }
  }

  const counter =
    selected.length === 1
      ? t("app.onboarding.countries.counterOne")
      : t("app.onboarding.countries.counterMany", { count: selected.length });

  // Move focus to the new step heading on change (not on initial mount) —
  // same pattern as the checker wizard.
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  const mounted = React.useRef(false);
  React.useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  // Step 3 flips to a closing screen when no selected country is covered:
  // asking "where are you registered?" with zero countries would be a dead end.
  const noneCovered = step === 3 && coveredSelected.length === 0;
  const stepTitle =
    step === 1
      ? t("app.onboarding.company.title")
      : step === 2
        ? t("app.onboarding.countries.title")
        : noneCovered
          ? t("app.onboarding.status.noneCoveredTitle")
          : t("app.onboarding.status.title");
  const stepSubtitle =
    step === 1
      ? t("app.onboarding.company.subtitle")
      : step === 2
        ? t("app.onboarding.countries.subtitle")
        : noneCovered
          ? t("app.onboarding.status.noneCoveredSubtitle")
          : t("app.onboarding.status.subtitle");

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="mx-auto w-full max-w-[640px] px-4 pt-8 sm:px-8">
        <p className="eyebrow text-muted-foreground">{t("app.onboarding.eyebrow")}</p>
        <div className="mt-3 flex items-center gap-3">
          {/* Decorative — the visible mono "Passo n di 3" carries the semantics. */}
          <div aria-hidden="true" className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-brand transition-[width] duration-300"
              style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            />
          </div>
          <span className="font-mono text-2xs text-muted-foreground">
            {t("app.onboarding.stepOf", { n: step, total: TOTAL_STEPS })}
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[640px] flex-1 px-4 py-10 sm:px-8">
        <form onSubmit={onSubmit} aria-labelledby="onboarding-question">
          {/* key remounts the block per step → the enter animation replays;
              the global prefers-reduced-motion rule disables it */}
          <div key={step} className="animate-card-enter">
            <h1
              ref={headingRef}
              tabIndex={-1}
              id="onboarding-question"
              className="font-display text-xl font-bold tracking-tightDisplay text-ink outline-none sm:text-2xl"
            >
              {stepTitle}
            </h1>
            <p className="mt-2 text-base text-muted-foreground">{stepSubtitle}</p>

            {step === 1 && (
              <div className="mt-8 flex flex-col gap-6">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="name">{t("app.onboarding.company.nameLabel")}</Label>
                  <Input
                    id="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("app.onboarding.company.namePlaceholder")}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="establishment">{t("app.onboarding.company.countryLabel")}</Label>
                  <Select
                    id="establishment"
                    required
                    value={establishment}
                    onChange={(e) => setEstablishment(e.target.value)}
                  >
                    <option value="" disabled>
                      {t("app.onboarding.company.countryPlaceholder")}
                    </option>
                    {euOptions.map((code) => (
                      <option key={code} value={code}>
                        {t(`countries.${code}`)}
                      </option>
                    ))}
                    <option value={EXTRA_EU}>{t(`countries.${EXTRA_EU}`)}</option>
                  </Select>
                  <p className="text-2xs text-muted-foreground">
                    {t("app.onboarding.company.countryHelp")}
                  </p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="vat">{t("app.onboarding.company.vatLabel")}</Label>
                  <Input
                    id="vat"
                    value={vat}
                    onChange={(e) => setVat(e.target.value)}
                    placeholder={t("app.onboarding.company.vatPlaceholder")}
                  />
                  <p className="text-2xs text-muted-foreground">
                    {t("app.onboarding.company.vatHelp")}
                  </p>
                </div>
              </div>
            )}

            {step === 2 && (
              <fieldset className="mt-8 border-0 p-0" aria-labelledby="onboarding-question">
                <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-2.5">
                  {euOptions.map((code) => (
                    <OptionCard
                      key={code}
                      type="checkbox"
                      name="selling-countries"
                      value={code}
                      checked={selected.includes(code)}
                      onChange={() => toggleCountry(code)}
                      label={t(`countries.${code}`)}
                      flagCode={code}
                      compact
                    />
                  ))}
                </div>
                {limitHit && (
                  <p role="status" className="mt-5 rounded-lg border border-warn/40 bg-warn/[0.06] p-4 text-2xs text-ink">
                    {t("app.onboarding.countries.limitNotice")}
                  </p>
                )}
                <p className="mt-5 text-2xs text-muted-foreground">
                  {coveredNames.length > 0 && (
                    <>
                      {t("check.steps.2.coverageIntro", { countries: coveredNames.join(", ") })}{" "}
                    </>
                  )}
                  {t("check.steps.2.coverageOutro")}
                </p>
              </fieldset>
            )}

            {step === 3 && (
              <div className="mt-8 flex flex-col gap-6">
                {noneCovered && (
                  <p className="rounded-lg border border-line bg-surface p-5 text-base text-muted-foreground">
                    {t("app.onboarding.status.noneCovered")}
                  </p>
                )}
                <div className="flex flex-col gap-3">
                  {coveredSelected.map((code) => {
                    return (
                      <fieldset key={code} className="rounded-lg border border-line bg-surface p-4">
                        <legend className="flex items-center gap-2 px-1 font-display text-xs font-semibold text-ink">
                          <Flag code={code} />
                          {t(`countries.${code}`)}
                        </legend>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {STATUS_ORDER.map((status) => {
                            const isChosen = (statusByCode[code] ?? "not_registered") === status;
                            return (
                              <label
                                key={status}
                                className={cn(
                                  "cursor-pointer rounded-full border px-3.5 py-1.5 text-2xs transition-colors",
                                  "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2",
                                  isChosen
                                    ? "border-brand bg-brand/[0.06] text-brand"
                                    : "border-line text-ink hover:border-brand",
                                )}
                              >
                                <input
                                  type="radio"
                                  name={`status-${code}`}
                                  className="sr-only"
                                  checked={isChosen}
                                  onChange={() =>
                                    setStatusByCode((prev) => ({ ...prev, [code]: status }))
                                  }
                                />
                                {t(`app.onboarding.status.options.${status}`)}
                              </label>
                            );
                          })}
                        </div>
                      </fieldset>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {error && (
            <p role="alert" className="mt-6 text-2xs text-risk">
              {error}
            </p>
          )}

          <div className="mt-10 flex items-center justify-between gap-4">
            {step > 1 ? (
              <Button type="button" variant="ghost" onClick={() => setStep(step - 1)}>
                ← {t("app.onboarding.back")}
              </Button>
            ) : (
              <span aria-hidden="true" />
            )}
            <div className="flex items-center gap-4">
              {step === 2 && selected.length > 0 && (
                <span className="font-mono text-2xs text-muted-foreground">{counter}</span>
              )}
              <Button type="submit" disabled={!canContinue || pending}>
                {pending
                  ? t("app.common.saving")
                  : step < TOTAL_STEPS
                    ? t("app.onboarding.continue")
                    : t("app.onboarding.status.submit")}
              </Button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
