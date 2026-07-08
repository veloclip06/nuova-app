import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HeroPreview } from "@/components/landing/hero-preview";
import { t } from "@/lib/i18n";

/**
 * Landing hero (Claude Design export "Landing hero"): register eyebrow, a
 * two-line display headline, one primary CTA to the free checker, and the
 * product preview underneath. Single primary CTA per screen (DESIGN_SYSTEM.md §6).
 */
export function Hero() {
  return (
    <section className="px-4 pt-16 sm:px-8 sm:pt-20">
      <div className="mx-auto max-w-[840px] text-center">
        <p className="eyebrow text-muted-foreground">{t("landing.hero.eyebrow")}</p>
        <h1 className="mt-4 font-display text-3xl font-bold leading-[1.12] tracking-tightDisplay sm:text-4xl">
          {t("landing.hero.titleLine1")}
          <br />
          {t("landing.hero.titleLine2")}
        </h1>
        <p className="mx-auto mt-4 max-w-[38ch] text-lg text-muted-foreground">
          {t("landing.hero.subtitle")}
        </p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <Button asChild size="lg">
            <Link href="/check">{t("landing.hero.cta")}</Link>
          </Button>
          <span className="font-mono text-2xs text-muted-foreground">
            {t("landing.hero.microcopy")}
          </span>
        </div>
      </div>
      <HeroPreview />
    </section>
  );
}
