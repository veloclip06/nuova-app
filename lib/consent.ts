/**
 * Minimal cookie/analytics consent state (§9: privacy + cookie banner minimi).
 * PostHog is the only tracker and must start ONLY after explicit consent
 * (ePrivacy / Garante cookie guidelines). Client-side only.
 */

export type ConsentValue = "granted" | "denied";

export const CONSENT_KEY = "cockpit-consent";

/** Fired on window when consent changes so the PostHog provider can react. */
export const CONSENT_EVENT = "cockpit:consent";

export function getConsent(): ConsentValue | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(CONSENT_KEY);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    return null;
  }
}

export function setConsent(value: ConsentValue): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CONSENT_KEY, value);
  } catch {
    // Storage unavailable (private mode): treat as session-only consent.
  }
  window.dispatchEvent(new CustomEvent<ConsentValue>(CONSENT_EVENT, { detail: value }));
}
