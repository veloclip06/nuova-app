import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Curated empty state for plan-gated features (never a disabled button —
 * ratified 2026-07-10). Mirrors the dashboard empty-state pattern; the badge
 * names the plan that unlocks the feature. Server-compatible (no hooks).
 */
const UNLOCK_PLAN: Record<string, "essenziale" | "completo"> = {
  report: "essenziale",
  csvImport: "completo",
  history: "completo",
};

export function UpgradeGate({
  feature,
  variant = "page",
}: {
  feature: "report" | "csvImport" | "history";
  variant?: "page" | "inline";
}) {
  const plan = UNLOCK_PLAN[feature];
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-3 rounded-lg border border-line bg-surface",
        variant === "page" ? "p-8" : "p-6",
      )}
    >
      <Badge tone="brand" filled>
        {t("app.plan.gate.unlockWith", { plan: t(`app.plan.names.${plan}`) })}
      </Badge>
      <h2 className="font-display text-lg font-semibold text-ink">
        {t(`app.plan.gate.${feature}.title`)}
      </h2>
      <p className="max-w-[52ch] text-sm text-muted-foreground">
        {t(`app.plan.gate.${feature}.body`)}
      </p>
      <Button asChild variant="outline" size="sm" className="mt-1">
        <Link href="/app/piano">{t(`app.plan.gate.${feature}.cta`)}</Link>
      </Button>
    </div>
  );
}
