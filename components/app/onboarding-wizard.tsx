"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { ESTABLISHMENT_EU, EXTRA_EU } from "@/lib/checker/options";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Flag } from "@/components/checker/flag";
import { completeOnboarding } from "@/app/onboarding/actions";
import type { CompanyCountryStatus } from "@/lib/app/types";

export interface WizardCountry {
  code: string;
  name: string;
  registerName: string;
}

const STATUS_ORDER: CompanyCountryStatus[] = ["not_registered", "in_progress", "registered"];
const TOTAL_STEPS = 3;

/**
 * Post-signup onboarding (PROMPT 5): crea azienda → seleziona paesi → primo
 * stato. One decision per screen with endowed progress (DESIGN_SYSTEM.md §8.1-2).
 */
export function OnboardingWizard({ countries }: { countries: WizardCountry[] }) {
  const [step, setStep] = React.useState(1);
  const [name, setName] = React.useState("");
  const [establishment, setEstablishment] = React.useState("");
  const [vat, setVat] = React.useState("");
  const [selected, setSelected] = React.useState<string[]>([]);
  const [statusByCode, setStatusByCode] = React.useState<Record<string, CompanyCountryStatus>>({});
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  const euOptions = React.useMemo(
    () =>
      [...ESTABLISHMENT_EU].sort((a, b) =>
        t(`countries.${a}`).localeCompare(t(`countries.${b}`), "it"),
      ),
    [],
  );

  const canContinue =
    step === 1 ? name.trim() !== "" && establishment !== "" : step === 2 ? selected.length > 0 : true;

  function toggleCountry(code: string) {
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
    const result = await completeOnboarding({
      name,
      establishmentCountry: establishment,
      vatNumber: vat,
      countries: selected.map((code) => ({
        code,
        status: statusByCode[code] ?? "not_registered",
      })),
    });
    // On success the action redirects; only errors return here.
    if (result?.error) {
      setError(t("app.onboarding.error"));
      setPending(false);
    }
  }

  const counter =
    selected.length === 1
      ? t("app.onboarding.countries.counterOne")
      : t("app.onboarding.countries.counterMany", { count: selected.length });

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="mx-auto w-full max-w-[640px] px-4 pt-8 sm:px-8">
        <p className="eyebrow text-muted-foreground">{t("app.onboarding.eyebrow")}</p>
        <div className="mt-3 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
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
        <form onSubmit={onSubmit} key={step} className="animate-card-enter">
          {step === 1 && (
            <div className="flex flex-col gap-6">
              <div>
                <h1 className="font-display text-xl font-bold tracking-tightDisplay text-ink sm:text-2xl">
                  {t("app.onboarding.company.title")}
                </h1>
                <p className="mt-2 text-base text-muted-foreground">
                  {t("app.onboarding.company.subtitle")}
                </p>
              </div>
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
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-6">
              <div>
                <h1 className="font-display text-xl font-bold tracking-tightDisplay text-ink sm:text-2xl">
                  {t("app.onboarding.countries.title")}
                </h1>
                <p className="mt-2 text-base text-muted-foreground">
                  {t("app.onboarding.countries.subtitle")}
                </p>
              </div>
              {countries.length === 0 ? (
                <p className="rounded-lg border border-line bg-surface p-5 text-base text-muted-foreground">
                  {t("app.onboarding.countries.empty")}
                </p>
              ) : (
                <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
                  {countries.map((country) => {
                    const checked = selected.includes(country.code);
                    return (
                      <label
                        key={country.code}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-lg border bg-surface p-4 transition-colors",
                          "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2",
                          checked ? "border-brand bg-brand/[0.04]" : "border-line hover:border-brand",
                        )}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={checked}
                          onChange={() => toggleCountry(country.code)}
                        />
                        <Flag code={country.code} />
                        <span className="min-w-0">
                          <span className="block text-xs font-medium text-ink">{country.name}</span>
                          <span className="block font-display text-2xs font-semibold uppercase tracking-register text-muted-foreground">
                            {country.registerName}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-6">
              <div>
                <h1 className="font-display text-xl font-bold tracking-tightDisplay text-ink sm:text-2xl">
                  {t("app.onboarding.status.title")}
                </h1>
                <p className="mt-2 text-base text-muted-foreground">
                  {t("app.onboarding.status.subtitle")}
                </p>
              </div>
              <div className="flex flex-col gap-3">
                {selected.map((code) => {
                  const country = countries.find((c) => c.code === code);
                  return (
                    <fieldset key={code} className="rounded-lg border border-line bg-surface p-4">
                      <legend className="flex items-center gap-2 px-1 font-display text-xs font-semibold text-ink">
                        <Flag code={code} />
                        {country?.name ?? code}
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

          {error && (
            <p role="alert" className="mt-6 text-2xs text-risk">
              {error}
            </p>
          )}

          <div className="mt-10 flex items-center justify-between gap-4">
            {step > 1 ? (
              <Button type="button" variant="ghost" onClick={() => setStep(step - 1)}>
                ← {t("app.onboarding.countries.back")}
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
                    ? t("app.onboarding.company.submit")
                    : t("app.onboarding.status.submit")}
              </Button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
