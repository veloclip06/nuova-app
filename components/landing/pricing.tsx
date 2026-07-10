import Link from "next/link";
import { Button } from "@/components/ui/button";
import { tList, t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Pricing — two annual tiers (ARCHITECTURE.md §8), the top one anchored
 * (DESIGN_SYSTEM.md §8.5): with two plans the anchor is the value gap, so the
 * full plan carries the highlight. Only the anchored tier carries the primary
 * button; the other is outline, so a single primary shows per screen (§6).
 * The free checker is deliberately NOT a tier — it renders as a strip below
 * the grid (ratified 10/07/2026). Prices render in mono — "i numeri sono il
 * prodotto" (§4). Reused on the landing and the /prezzi page.
 */
interface Tier {
  id: string;
  name: string;
  price: string;
  tagline: string;
  features: string[];
  cta: string;
  href: string;
}

const HIGHLIGHTED = "completo";

function Check() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 12 12"
      className="mt-1 h-3 w-3 shrink-0 text-brand"
      fill="none"
    >
      <path
        d="M2.5 6.5 5 9l4.5-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PricingSection() {
  const tiers = tList<Tier>("landing.pricing.tiers");

  return (
    <section id="prezzi" className="scroll-mt-8 px-4 py-20 sm:px-8">
      <div className="mx-auto max-w-[1080px]">
        <p className="eyebrow text-muted-foreground">{t("landing.pricing.eyebrow")}</p>
        <h2 className="mt-3 font-display text-2xl font-bold tracking-tightDisplay sm:text-3xl">
          {t("landing.pricing.title")}
        </h2>
        <p className="mt-3 max-w-[52ch] text-base text-muted-foreground">
          {t("landing.pricing.subtitle")}
        </p>

        <div className="mx-auto mt-10 grid max-w-[760px] grid-cols-1 items-start gap-5 md:grid-cols-2">
          {tiers.map((tier) => {
            const featured = tier.id === HIGHLIGHTED;
            return (
              <div
                key={tier.id}
                className={cn(
                  "flex h-full flex-col rounded-lg border bg-surface p-6",
                  featured ? "border-brand shadow-[inset_0_0_0_1px_var(--brand)]" : "border-line",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-lg font-semibold text-ink">
                    {tier.name}
                  </h3>
                  {featured && (
                    <span className="rounded-sm border border-brand px-2 py-0.5 font-display text-[11px] font-semibold uppercase tracking-register text-brand">
                      {t("landing.pricing.recommended")}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-2xs text-muted-foreground">{tier.tagline}</p>
                <p className="mt-4 flex items-baseline gap-1">
                  <span className="font-mono text-3xl font-semibold text-ink">
                    {tier.price}
                  </span>
                  <span className="font-mono text-2xs text-muted-foreground">
                    {t("landing.pricing.period")}
                  </span>
                </p>

                <ul className="mt-6 flex flex-1 flex-col gap-2.5 text-xs text-ink">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex gap-2.5">
                      <Check />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  variant={featured ? "primary" : "outline"}
                  className="mt-6 w-full"
                >
                  <Link href={tier.href}>{tier.cta}</Link>
                </Button>
              </div>
            );
          })}
        </div>

        <div className="mx-auto mt-6 flex max-w-[760px] flex-col gap-1 font-mono text-2xs text-muted-foreground">
          <span>{t("landing.pricing.annualNote")}</span>
          <span>{t("landing.pricing.reassurance")}</span>
        </div>

        <div className="mx-auto mt-10 flex max-w-[760px] flex-col items-start gap-2 rounded-lg border border-line bg-surface px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <p className="text-sm text-ink">{t("landing.pricing.checkerStrip.text")}</p>
          <Link
            href="/check"
            className="text-xs font-semibold text-brand underline-offset-4 hover:underline"
          >
            {t("landing.pricing.checkerStrip.cta")}
          </Link>
        </div>
      </div>
    </section>
  );
}
