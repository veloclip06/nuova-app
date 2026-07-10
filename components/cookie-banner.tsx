"use client";

import * as React from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getConsent, setConsent } from "@/lib/consent";
import { t } from "@/lib/i18n";

/**
 * Minimal consent banner (§9). PostHog — the only tracker — starts only after
 * "Accetta" (components/posthog-provider.tsx listens for the consent event).
 * Renders nothing until mounted (hydration-safe: consent lives in
 * localStorage) and nothing once a choice is stored.
 */
export function CookieBanner() {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    setVisible(getConsent() === null);
  }, []);

  if (!visible) return null;

  function choose(value: "granted" | "denied") {
    setConsent(value);
    setVisible(false);
  }

  return (
    <div
      role="region"
      aria-label={t("consent.ariaLabel")}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-surface p-4 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]"
    >
      <div className="mx-auto flex max-w-4xl flex-col items-start gap-3 sm:flex-row sm:items-center">
        <p className="flex-1 text-sm text-muted-ink">
          {t("consent.body")}{" "}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-ink">
            {t("consent.privacyLink")}
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => choose("denied")}>
            {t("consent.reject")}
          </Button>
          <Button type="button" variant="primary" size="sm" onClick={() => choose("granted")}>
            {t("consent.accept")}
          </Button>
        </div>
      </div>
    </div>
  );
}
