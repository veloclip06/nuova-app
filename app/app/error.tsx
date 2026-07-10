"use client";

import * as React from "react";
import { t } from "@/lib/i18n";
import { AppMain } from "@/components/app/app-main";
import { Button } from "@/components/ui/button";

/**
 * Error boundary for all /app data views (DESIGN_SYSTEM.md §10). Renders
 * inside the app shell, so the sidebar stays usable while the view retries.
 */
export default function AppViewError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[app] view error:", error);
  }, [error]);

  return (
    <AppMain>
      <div className="flex flex-col items-start gap-3 rounded-lg border border-line bg-surface p-8">
        <h2 className="font-display text-lg font-semibold text-ink">
          {t("app.common.errorTitle")}
        </h2>
        <p className="max-w-prose text-base text-muted-foreground">
          {t("app.common.loadingError")}
        </p>
        <Button variant="outline" size="sm" onClick={() => reset()}>
          {t("common.retry")}
        </Button>
      </div>
    </AppMain>
  );
}
