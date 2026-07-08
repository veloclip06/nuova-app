import Link from "next/link";
import { t } from "@/lib/i18n";
import { TOTAL_STEPS } from "@/lib/checker/options";

/**
 * Wizard header + endowed progress bar (DESIGN_SYSTEM.md §8.2, design export
 * "Checker passo 2"). The bar is decorative — the visible mono "Passo n di 5"
 * carries the semantics, so screen readers hear it once.
 */
export function ProgressHeader({ step }: { step: number }) {
  return (
    <header className="bg-surface">
      <div className="mx-auto flex w-full max-w-[760px] items-center justify-between px-4 py-4 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5 rounded-sm">
          <span aria-hidden="true" className="inline-block h-3 w-3 rounded-[3px] bg-brand" />
          <span className="font-display text-2xs font-bold uppercase tracking-[0.1em] text-ink">
            {t("common.appName")}
          </span>
        </Link>
        <span className="font-mono text-2xs text-muted-foreground">
          {t("check.progress", { n: step, total: TOTAL_STEPS })}
        </span>
      </div>
      <div aria-hidden="true" className="h-1 w-full bg-line">
        <div
          className="h-full bg-brand transition-[width] duration-300"
          style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
        />
      </div>
    </header>
  );
}
