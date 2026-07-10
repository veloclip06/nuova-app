/**
 * Canonical analytics event names. The checker funnel is the priority signal
 * (ARCHITECTURE.md §6 — "dove abbandonano = oro"). Keep names stable: renaming
 * an event breaks historical funnels in PostHog.
 */
export const EVENTS = {
  checkerStep: (step: 1 | 2 | 3 | 4 | 5) => `checker_step_${step}` as const,
  checkerResult: "checker_result",
  checkerEmailSubmitted: "checker_email_submitted",
  /** Onboarding selections of countries without a rule file — demand signal. */
  onboardingInterest: "onboarding_interest_countries",
  /** Upgrade funnel (/app/piano → Stripe Checkout). */
  upgradeViewed: "upgrade_viewed",
  checkoutStarted: "checkout_started",
  checkoutCompleted: "checkout_completed",
} as const;
