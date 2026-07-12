import Link from "next/link";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";

/**
 * Closing CTA after the FAQ — repeats the hero's primary action so a visitor
 * who read to the bottom doesn't have to scroll back up. Deviation from the
 * "one primary CTA per screen" rule ratified in chat (11/07/2026): same
 * action, same label (§9 — the action name never changes), never visible
 * together with the hero button on one viewport.
 */
export function FinalCta() {
  return (
    <section className="border-t border-line bg-surface px-4 py-20 sm:px-8">
      <div className="mx-auto max-w-[840px] text-center">
        <h2 className="font-display text-2xl font-bold tracking-tightDisplay sm:text-3xl">
          {t("landing.finalCta.title")}
        </h2>
        <div className="mt-7 flex flex-col items-center gap-3">
          <Button asChild size="lg">
            <Link href="/check">{t("landing.hero.cta")}</Link>
          </Button>
          <span className="font-mono text-2xs text-muted-foreground">
            {t("landing.hero.microcopy")}
          </span>
        </div>
      </div>
    </section>
  );
}
