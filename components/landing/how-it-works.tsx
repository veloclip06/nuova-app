import { tList, t } from "@/lib/i18n";

/**
 * "Come funziona" — the three-step path (check → packaging data → ready-to-paste
 * reports). No CTA here: the hero keeps the single primary per screen; this
 * section just explains the flow (DESIGN_SYSTEM.md §6, §8).
 */
interface HowStep {
  step: string;
  title: string;
  body: string;
}

export function HowItWorks() {
  const steps = tList<HowStep>("landing.how.steps");

  return (
    <section className="border-y border-line bg-surface px-4 py-20 sm:px-8">
      <div className="mx-auto max-w-[1080px]">
        <p className="eyebrow text-muted-foreground">{t("landing.how.eyebrow")}</p>
        <h2 className="mt-3 max-w-[20ch] font-display text-2xl font-bold tracking-tightDisplay sm:text-3xl">
          {t("landing.how.title")}
        </h2>

        <ol className="mt-10 grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-3">
          {steps.map((step) => (
            <li key={step.step} className="flex flex-col">
              <span className="font-mono text-2xl font-medium tabular-nums text-brand">
                {step.step}
              </span>
              <span className="mt-4 h-px w-10 bg-line" />
              <h3 className="mt-4 font-display text-lg font-semibold text-ink">
                {step.title}
              </h3>
              <p className="mt-2 text-xs text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
