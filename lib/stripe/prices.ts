/**
 * Plan ↔ Stripe price mapping, read from env so swapping the mock placeholders
 * for real price IDs (STRIPE_SETUP.md) requires zero code changes. Pure and
 * env-injectable for tests. `null` means "not configured / unknown" — callers
 * fail closed (friendly config error in the checkout action, ignored price in
 * the webhook).
 */

export type PaidPlanId = "essenziale" | "completo";

export interface PriceEnv {
  essenziale?: string;
  completo?: string;
}

export function readPriceEnv(env: NodeJS.ProcessEnv = process.env): PriceEnv {
  return {
    essenziale: env.NEXT_PUBLIC_STRIPE_PRICE_ESSENZIALE,
    completo: env.NEXT_PUBLIC_STRIPE_PRICE_COMPLETO,
  };
}

export function priceIdForPlan(plan: PaidPlanId, prices: PriceEnv = readPriceEnv()): string | null {
  return prices[plan] || null;
}

export function planForPriceId(priceId: string, prices: PriceEnv = readPriceEnv()): PaidPlanId | null {
  if (priceId && prices.essenziale === priceId) return "essenziale";
  if (priceId && prices.completo === priceId) return "completo";
  return null;
}
