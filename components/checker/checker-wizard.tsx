"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { capture } from "@/lib/analytics/capture";
import { EVENTS } from "@/lib/analytics/events";
import {
  CHANNEL_IDS,
  ESTABLISHMENT_EU,
  EXTRA_EU,
  INTEREST_SELLING,
  PRIMARY_SELLING,
  PRODUCT_TYPE_IDS,
  TOTAL_STEPS,
  VOLUME_BAND_IDS,
  optionKeys,
  type CheckerAnswers,
} from "@/lib/checker/options";
import { encodeAnswers } from "@/lib/checker/params";
import { Button } from "@/components/ui/button";
import { Flag } from "./flag";
import { OptionCard } from "./option-card";
import { ProgressHeader } from "./progress-header";

/**
 * The 5-step checker (ARCHITECTURE.md §6): one question per screen, endowed
 * progress, answers in local state only — no login, nothing persisted until
 * the email gate. Submitting pushes /check/risultato?…, where the server
 * runs the rules engine; this component never computes obligations.
 *
 * Funnel: checker_step_n fires once per step view ("dove abbandonano = oro").
 */

const EMPTY_ANSWERS: CheckerAnswers = {
  establishment: "",
  selling: [],
  channels: [],
  productTypes: [],
  volumeByCountry: {},
};

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function StepHelp({ step }: { step: number }) {
  return <p className="mt-2 text-base text-muted-foreground">{t(`check.steps.${step}.help`)}</p>;
}

export function CheckerWizard() {
  const router = useRouter();
  const [step, setStep] = React.useState(1);
  const [answers, setAnswers] = React.useState<CheckerAnswers>(EMPTY_ANSWERS);

  // Funnel event once per step view; Back never refires.
  const trackedSteps = React.useRef(new Set<number>());
  React.useEffect(() => {
    if (trackedSteps.current.has(step)) return;
    trackedSteps.current.add(step);
    capture(EVENTS.checkerStep(step as 1 | 2 | 3 | 4 | 5));
  }, [step]);

  // Move focus to the new question on step change (not on initial mount).
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  const mounted = React.useRef(false);
  React.useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  const canContinue =
    step === 1
      ? answers.establishment !== ""
      : step === 2
        ? answers.selling.length > 0
        : step === 3
          ? answers.channels.length > 0
          : step === 4
            ? answers.productTypes.length > 0
            : answers.selling.every((code) => Boolean(answers.volumeByCountry[code]));

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canContinue) return;
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      router.push(`/check/risultato?${encodeAnswers(answers)}`);
    }
  }

  const euSorted = React.useMemo(
    () =>
      [...ESTABLISHMENT_EU].sort((a, b) =>
        t(optionKeys.country(a)).localeCompare(t(optionKeys.country(b)), "it"),
      ),
    [],
  );

  const counter =
    answers.selling.length === 1
      ? t("check.steps.2.counterOne")
      : t("check.steps.2.counterMany", { count: answers.selling.length });

  return (
    <>
      <ProgressHeader step={step} />
      <main className="mx-auto w-full max-w-[760px] flex-1 px-4 py-10 sm:px-8 sm:py-14">
        <form onSubmit={onSubmit} aria-labelledby="checker-question">
          {/* key remounts the block per step → the enter animation replays;
              the global prefers-reduced-motion rule disables it */}
          <div key={step} className="animate-card-enter">
            <h1
              ref={headingRef}
              tabIndex={-1}
              id="checker-question"
              className="font-display text-xl font-bold tracking-tightDisplay text-ink outline-none sm:text-2xl"
            >
              {t(`check.steps.${step}.title`)}
            </h1>
            <StepHelp step={step} />

            <fieldset className="mt-8 border-0 p-0" aria-labelledby="checker-question">
              {step === 1 && (
                <select
                  value={answers.establishment}
                  onChange={(event) =>
                    setAnswers({ ...answers, establishment: event.target.value })
                  }
                  className="h-12 w-full max-w-md rounded-lg border border-line bg-surface px-4 text-base text-ink"
                >
                  <option value="" disabled>
                    {t("check.steps.1.placeholder")}
                  </option>
                  <optgroup label={t("check.steps.1.euGroup")}>
                    {euSorted.map((code) => (
                      <option key={code} value={code}>
                        {t(optionKeys.country(code))}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label={t("check.steps.1.nonEuGroup")}>
                    <option value={EXTRA_EU}>{t(optionKeys.country(EXTRA_EU))}</option>
                  </optgroup>
                </select>
              )}

              {step === 2 && (
                <>
                  <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3.5">
                    {PRIMARY_SELLING.map((code) => (
                      <OptionCard
                        key={code}
                        type="checkbox"
                        name="selling"
                        value={code}
                        checked={answers.selling.includes(code)}
                        onChange={() =>
                          setAnswers({ ...answers, selling: toggle(answers.selling, code) })
                        }
                        label={t(optionKeys.country(code))}
                        sublabel={t(`check.options.registers.${code}`)}
                        flagCode={code}
                      />
                    ))}
                  </div>
                  <p className="eyebrow mb-3 mt-8 text-muted-foreground">
                    {t("check.steps.2.othersLabel")}
                  </p>
                  <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-2.5">
                    {INTEREST_SELLING.map((code) => (
                      <OptionCard
                        key={code}
                        type="checkbox"
                        name="selling"
                        value={code}
                        checked={answers.selling.includes(code)}
                        onChange={() =>
                          setAnswers({ ...answers, selling: toggle(answers.selling, code) })
                        }
                        label={t(optionKeys.country(code))}
                        flagCode={code}
                        compact
                      />
                    ))}
                  </div>
                </>
              )}

              {step === 3 && (
                <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3.5">
                  {CHANNEL_IDS.map((id) => (
                    <OptionCard
                      key={id}
                      type="checkbox"
                      name="channels"
                      value={id}
                      checked={answers.channels.includes(id)}
                      onChange={() =>
                        setAnswers({ ...answers, channels: toggle(answers.channels, id) })
                      }
                      label={t(optionKeys.channel(id))}
                    />
                  ))}
                </div>
              )}

              {step === 4 && (
                <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3.5">
                  {PRODUCT_TYPE_IDS.map((id) => (
                    <OptionCard
                      key={id}
                      type="checkbox"
                      name="productTypes"
                      value={id}
                      checked={answers.productTypes.includes(id)}
                      onChange={() =>
                        setAnswers({
                          ...answers,
                          productTypes: toggle(answers.productTypes, id),
                        })
                      }
                      label={t(optionKeys.productType(id))}
                    />
                  ))}
                </div>
              )}

              {step === 5 && (
                <div className="flex flex-col gap-4">
                  {answers.selling.map((code) => (
                    <fieldset
                      key={code}
                      className="rounded-lg border border-line bg-surface p-4"
                    >
                      <legend className="flex items-center gap-2 px-1 font-display text-xs font-semibold text-ink">
                        <Flag code={code} />
                        {t(optionKeys.country(code))}
                      </legend>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {VOLUME_BAND_IDS.map((band) => {
                          const selected = answers.volumeByCountry[code] === band;
                          return (
                            <label
                              key={band}
                              className={cn(
                                "cursor-pointer rounded-full border px-3.5 py-1.5 font-mono text-2xs transition-colors",
                                "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-background",
                                selected
                                  ? "border-brand bg-brand/[0.06] text-brand"
                                  : "border-line bg-surface text-ink hover:border-brand",
                              )}
                            >
                              <input
                                type="radio"
                                name={`volume-${code}`}
                                value={band}
                                checked={selected}
                                onChange={() =>
                                  setAnswers({
                                    ...answers,
                                    volumeByCountry: {
                                      ...answers.volumeByCountry,
                                      [code]: band,
                                    },
                                  })
                                }
                                className="sr-only"
                              />
                              {t(optionKeys.volume(band))}
                            </label>
                          );
                        })}
                      </div>
                    </fieldset>
                  ))}
                </div>
              )}
            </fieldset>
          </div>

          <div className="mt-10 flex items-center justify-between gap-4">
            {step > 1 ? (
              <Button type="button" variant="ghost" onClick={() => setStep(step - 1)}>
                ← {t("common.back")}
              </Button>
            ) : (
              <span aria-hidden="true" />
            )}
            <div className="flex items-center gap-4">
              {step === 2 && (
                <span className="font-mono text-2xs text-muted-foreground">{counter}</span>
              )}
              <Button type="submit" disabled={!canContinue}>
                {step < TOTAL_STEPS ? t("check.steps.continue") : t("check.steps.showResult")}
              </Button>
            </div>
          </div>
        </form>
      </main>
    </>
  );
}
