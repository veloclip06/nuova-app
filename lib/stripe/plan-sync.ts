import type { PlanId } from "@/lib/plans";
import { planForPriceId, readPriceEnv, type PriceEnv } from "./prices";

/**
 * Pure webhook logic: derive the target `companies.plan` from a subscription
 * snapshot. Structural type instead of Stripe.Subscription so this stays
 * SDK-free and unit-testable.
 *
 * Handlers built on this are state-convergent (they always SET the derived
 * plan, never toggle/increment), which makes webhook replays and out-of-order
 * deliveries idempotent without an event-id ledger.
 */
export interface SubscriptionLike {
  status: string;
  priceIds: string[];
}

/**
 * Statuses that keep access to the paid plan. `past_due` is deliberate dunning
 * grace: Stripe retries the payment and emits subscription.updated /
 * subscription.deleted when the retry cycle resolves.
 */
const ACTIVE_STATUSES = new Set(["active", "trialing", "past_due"]);

export function planFromSubscription(
  sub: SubscriptionLike,
  prices: PriceEnv = readPriceEnv(),
): PlanId {
  if (!ACTIVE_STATUSES.has(sub.status)) return "free";
  for (const priceId of sub.priceIds) {
    const plan = planForPriceId(priceId, prices);
    if (plan) return plan;
  }
  // Fail closed: an active subscription on an unrecognised price grants nothing.
  return "free";
}
