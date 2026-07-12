"use client";

import * as React from "react";

import { openBillingPortal, startCheckout } from "@/app/app/piano/actions";
import { capture } from "@/lib/analytics/capture";
import { EVENTS } from "@/lib/analytics/events";
import { isPaidPlan, type PlanId } from "@/lib/plans";
import type { PaidPlanId } from "@/lib/stripe/prices";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { t, tList } from "@/lib/i18n";
import { cn } from "@/lib/utils";

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
    <svg aria-hidden="true" viewBox="0 0 12 12" className="mt-1 h-3 w-3 shrink-0 text-brand" fill="none">
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

/**
 * Plan cards + checkout/portal CTAs. Reuses the ratified pricing copy
 * (landing.pricing.tiers) but with in-app actions instead of /registrati
 * links. Free plan: checkout CTAs (Completo carries the single primary, §6).
 * Paid plan: one Portal CTA — plan changes go through Stripe, never a second
 * checkout. The plan shown comes from the DB; the webhook is the only writer.
 */
export function PianoClient({
  plan,
  checkoutStatus,
}: {
  plan: PlanId;
  checkoutStatus: "success" | "cancelled" | null;
}) {
  const tiers = tList<Tier>("landing.pricing.tiers");
  const paid = isPaidPlan(plan);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<"config" | "stripe" | null>(null);
  const viewed = React.useRef(false);

  React.useEffect(() => {
    if (viewed.current) return;
    viewed.current = true;
    capture(EVENTS.upgradeViewed, { plan });
    // Best-effort, consent-gated; the webhook capture is authoritative.
    if (checkoutStatus === "success") capture(EVENTS.checkoutCompleted, { source: "return" });
  }, [plan, checkoutStatus]);

  function onCheckout(tierId: PaidPlanId) {
    capture(EVENTS.checkoutStarted, { plan: tierId });
    setError(null);
    startTransition(async () => {
      const result = await startCheckout(tierId);
      if (result?.error) setError(result.error);
    });
  }

  function onPortal() {
    setError(null);
    startTransition(async () => {
      const result = await openBillingPortal();
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {checkoutStatus === "success" && (
        <div className="rounded-lg border border-ok/40 bg-ok/[0.06] p-4">
          <p className="font-display text-sm font-semibold text-ink">
            {t("app.plan.success.title")}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{t("app.plan.success.body")}</p>
        </div>
      )}
      {checkoutStatus === "cancelled" && (
        <div className="rounded-lg border border-line bg-surface p-4">
          <p className="text-xs text-muted-foreground">{t("app.plan.cancelled")}</p>
        </div>
      )}

      <div className="flex items-center gap-3 rounded-lg border border-line bg-surface px-5 py-4">
        <Badge tone="brand" filled>
          {t(`app.plan.names.${plan}`)}
        </Badge>
        <p className="text-xs text-muted-foreground">
          {plan === "free"
            ? t("app.plan.freeBanner")
            : t("app.plan.currentBanner", { plan: t(`app.plan.names.${plan}`) })}
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-2">
        {tiers.map((tier) => {
          const featured = tier.id === HIGHLIGHTED;
          const isCurrent = tier.id === plan;
          return (
            <div
              key={tier.id}
              className={cn(
                "flex h-full flex-col rounded-lg border bg-surface p-6",
                featured ? "border-brand shadow-[inset_0_0_0_1px_var(--brand)]" : "border-line",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display text-lg font-semibold text-ink">{tier.name}</h3>
                {isCurrent ? (
                  <Badge tone="brand" filled>
                    {t("app.plan.currentBadge")}
                  </Badge>
                ) : featured ? (
                  <span className="rounded-sm border border-brand px-2 py-0.5 font-display text-[11px] font-semibold uppercase tracking-register text-brand">
                    {t("landing.pricing.recommended")}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-2xs text-muted-foreground">{tier.tagline}</p>
              <p className="mt-4 flex items-baseline gap-1">
                <span className="font-mono text-3xl font-semibold text-ink">{tier.price}</span>
                <span className="font-mono text-2xs text-muted-foreground">
                  {t("landing.pricing.period")}
                </span>
              </p>

              <p className="eyebrow mt-6 border-t border-line pt-4 text-[10px] text-muted-foreground">
                {t("landing.pricing.featuresLabel")}
              </p>
              <ul className="mt-3 flex flex-1 flex-col gap-2.5 text-xs text-ink">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex gap-2.5">
                    <Check />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {!paid && (
                <Button
                  type="button"
                  variant={featured ? "primary" : "outline"}
                  className="mt-6 w-full"
                  disabled={pending}
                  onClick={() => onCheckout(tier.id as PaidPlanId)}
                >
                  {pending ? t("app.common.saving") : tier.cta}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {error && <p className="text-xs text-risk">{t(`app.plan.error.${error}`)}</p>}

      {paid ? (
        <div className="flex flex-col items-start gap-2 rounded-lg border border-line bg-surface px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div>
            <p className="font-display text-sm font-semibold text-ink">
              {t("app.plan.portalTitle")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{t("app.plan.portalBody")}</p>
          </div>
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={pending}
            onClick={onPortal}
          >
            {pending ? t("app.common.saving") : t("app.plan.portalCta")}
          </Button>
        </div>
      ) : (
        <p className="font-mono text-2xs text-muted-foreground">{t("app.plan.checkoutNote")}</p>
      )}
    </div>
  );
}
