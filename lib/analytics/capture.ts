import posthog from "posthog-js";

/**
 * Safe client-side capture for the checker funnel. Import from client
 * components only.
 *
 * - No-ops without NEXT_PUBLIC_POSTHOG_KEY (the app must run keyless — the
 *   provider in components/posthog-provider.tsx follows the same rule).
 * - Defers one tick when posthog is not initialised yet: child effects run
 *   before PostHogProvider's init effect, so a capture fired from the first
 *   mount (checker_step_1 on a hard load) would otherwise be dropped.
 */
export function capture(event: string, properties?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  if (posthog.__loaded) {
    posthog.capture(event, properties);
    return;
  }
  setTimeout(() => {
    if (posthog.__loaded) posthog.capture(event, properties);
  }, 0);
}
