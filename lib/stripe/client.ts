import "server-only";

import Stripe from "stripe";

let cached: Stripe | null = null;

/**
 * Lazy server-side Stripe client (same pattern as createAdminClient): nothing
 * is constructed at module load, so builds and keyless dev environments never
 * touch STRIPE_SECRET_KEY. Callers wrap usage in try/catch and surface a
 * friendly "not configured" error until the real key exists (STRIPE_SETUP.md).
 *
 * apiVersion is intentionally omitted: the SDK pins the API version its types
 * were generated for, and the webhook only reads long-stable fields.
 */
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured (see STRIPE_SETUP.md)");
  }
  cached ??= new Stripe(key);
  return cached;
}
