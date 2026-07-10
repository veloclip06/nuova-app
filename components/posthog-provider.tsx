"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";

import { CONSENT_EVENT, getConsent } from "@/lib/consent";

/**
 * Client-side PostHog. EU host by default (data in the EU region — §9 / GDPR).
 * No-ops when NEXT_PUBLIC_POSTHOG_KEY is unset so the app runs without keys.
 *
 * Consent-gated (§9, cookie banner): init happens only after the user grants
 * consent — either stored from a previous visit or granted live via the
 * banner's CONSENT_EVENT. Pre-consent captures are dropped by design
 * (lib/analytics/capture.ts no-ops while posthog.__loaded is false).
 *
 * Pageview capture is manual (App Router has no full page reloads) — wire it in
 * the checker/route views as needed alongside the funnel events.
 */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;

    function init() {
      if (posthog.__loaded) return;
      posthog.init(key!, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com",
        capture_pageview: false,
        person_profiles: "identified_only",
      });
    }

    if (getConsent() === "granted") init();

    function onConsent(event: Event) {
      if ((event as CustomEvent<string>).detail === "granted") init();
    }
    window.addEventListener(CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(CONSENT_EVENT, onConsent);
  }, []);

  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return <>{children}</>;
  return <PHProvider client={posthog}>{children}</PHProvider>;
}
