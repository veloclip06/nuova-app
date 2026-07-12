import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { loadAllRules } from "@/lib/rules/load";
import { checkObligations } from "@/lib/engine/check-obligations";
import { decodeAnswers } from "@/lib/checker/params";
import { optionKeys, toCheckerInput } from "@/lib/checker/options";
import { sealStatusFor } from "@/lib/checker/seal-status";
import { formatDateIt, todayInRome } from "@/lib/checker/format";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmailGate } from "@/components/checker/email-gate";
import { ResultCard } from "@/components/checker/result-card";
import { ResultTracker } from "@/components/checker/result-tracker";
import { SiteFooter } from "@/components/site-footer";

/**
 * Checker result (ARCHITECTURE.md §6 step 6) — server component: parses the
 * answers from the URL, loads the YAML rules and runs the engine at request
 * time. Nothing normative is computed client-side.
 *
 * noindex is a declared deviation from ARCHITECTURE.md §2 (approved
 * 2026-07-07): the page depends on query params, so crawlers get infinite
 * unstable variants; /check stays the indexable entry.
 */
export const metadata: Metadata = {
  title: t("meta.result.title"),
  robots: { index: false, follow: true },
  alternates: { canonical: "/check" },
};

/**
 * Digits in mono, semibold and full paper on the dimmed sentence — as in the
 * design export, the counts punch through ("i numeri sono il prodotto", §4).
 */
function MonoNumbers({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\d+)/).map((part, i) =>
        /^\d+$/.test(part) ? (
          <span key={i} className="font-mono font-semibold text-paper">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
}

export default async function CheckResultPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const answers = decodeAnswers(await searchParams);
  if (!answers) redirect("/check");

  const referenceDate = todayInRome();
  const loaded = loadAllRules();
  if (loaded.errors.length > 0) {
    console.error("[rules] failed to load:", loaded.errors);
  }
  const rules = loaded.ok.map(({ rule }) => rule);
  const obligations = checkObligations(toCheckerInput(answers, referenceDate), rules);

  const coveredCodes = new Set(obligations.map((o) => o.countryCode));
  const notCovered = answers.selling.filter((code) => !coveredCodes.has(code));
  const notCoveredNames = notCovered.map((code) => t(optionKeys.country(code)));
  const exposedCount = obligations.filter((o) => sealStatusFor(o) === "esposto").length;

  const summary =
    obligations.length === 0
      ? t("check.result.summaryNoneCovered")
      : exposedCount === 1
        ? t("check.result.summaryExposedOne", { total: obligations.length })
        : exposedCount > 1
          ? t("check.result.summaryExposed", { n: exposedCount, total: obligations.length })
          : obligations.length === 1
            ? t("check.result.summaryActionOne", { total: obligations.length })
            : t("check.result.summaryAction", {
                n: obligations.length,
                total: obligations.length,
              });

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="bg-ink pb-24 text-paper">
        <div className="mx-auto w-full max-w-[1080px] px-4 pt-5 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-paper/15 pb-5">
            <Link href="/" className="flex items-center gap-2.5 rounded-sm">
              <span aria-hidden="true" className="inline-block h-3 w-3 rounded-[3px] bg-brand" />
              <span className="font-display text-2xs font-bold uppercase tracking-[0.1em]">
                {t("common.appName")}
              </span>
            </Link>
            <span className="font-mono text-2xs text-paper/60">
              {t("check.result.checkCompleted")} ·{" "}
              <span className="text-paper/80">{formatDateIt(referenceDate)}</span>
            </span>
          </div>
          <div className="mt-12 max-w-[720px]">
            <p className="eyebrow text-paper/60">{t("check.result.eyebrow")}</p>
            <h1 className="mt-2 font-display text-2xl font-bold tracking-tightDisplay sm:text-3xl">
              {t("check.resultTitle")}
            </h1>
            <p className="mt-3 text-lg text-paper/85">
              <MonoNumbers text={summary} />
            </p>
            <p className="mt-2 text-2xs text-paper/60">{t("check.result.assumptionNote")}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1080px] flex-1 px-4 sm:px-8">
        <div className="-mt-16 flex flex-col gap-6">
          {obligations.length > 0 && (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5">
              {obligations.map((obligation, index) => (
                <ResultCard
                  key={obligation.countryCode}
                  obligation={obligation}
                  index={index}
                  referenceDate={referenceDate}
                />
              ))}
            </div>
          )}
          {notCovered.length > 0 && (
            <p
              className={cn(
                "text-2xs text-muted-foreground",
                obligations.length === 0 &&
                  "rounded-lg border border-line bg-surface p-5 text-base text-ink",
              )}
            >
              {t("check.result.notCoveredNote", { countries: notCoveredNames.join(", ") })}
            </p>
          )}
        </div>

        <div className="mt-12">
          <EmailGate answers={answers} />
        </div>
        <div className="mb-14 mt-6 text-center">
          <Button asChild variant="outline">
            <Link href="/registrati">{t("check.ctaRegister")}</Link>
          </Button>
        </div>
      </main>

      <SiteFooter />
      <ResultTracker
        covered={obligations.length}
        exposed={exposedCount}
        notCoveredCountries={notCovered}
        establishment={answers.establishment}
        channels={answers.channels}
      />
    </div>
  );
}
