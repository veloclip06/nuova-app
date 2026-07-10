import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { EVENTS } from "@/lib/analytics/events";
import { getPostHogServer } from "@/lib/analytics/posthog-server";
import { planFromSubscription } from "@/lib/stripe/plan-sync";
import { getStripe } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Stripe webhook — the only writer of `companies.plan` (never trust the
 * client; the success redirect is cosmetic). Signature-verified, service-role
 * writes.
 *
 * Idempotency: handlers are state-convergent — they SET the plan derived from
 * the current subscription snapshot (lib/stripe/plan-sync.ts), never
 * toggle/increment. Replays and out-of-order deliveries converge to the same
 * row state, so no event-id ledger is needed. The checkout action pre-creates
 * the customer and persists stripe_customer_id, which keeps subscription
 * events resolvable regardless of delivery order.
 *
 * Response codes: 200 for handled AND irrelevant events; 200 + warn for
 * unknown customers/companies (4xx/5xx would make Stripe retry forever on
 * data we will never resolve); 500 only for our own failures (Stripe retries).
 */
export async function POST(request: Request): Promise<NextResponse> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET is not configured");
    return NextResponse.json({ ok: false, error: "not configured" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    const payload = await request.text();
    const signature = request.headers.get("stripe-signature") ?? "";
    event = await getStripe().webhooks.constructEventAsync(payload, signature, secret);
  } catch (error) {
    console.warn("[stripe-webhook] signature verification failed", error);
    return NextResponse.json({ ok: false, error: "invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        return await handleCheckoutCompleted(event.data.object);
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        return await handleSubscriptionChange(event.data.object);
      default:
        return NextResponse.json({ received: true });
    }
  } catch (error) {
    // Our failure (Supabase/Stripe API) — 500 so Stripe retries the event.
    console.error(`[stripe-webhook] ${event.type} failed`, error);
    return NextResponse.json({ ok: false, error: "handler failed" }, { status: 500 });
  }
}

function subscriptionSnapshot(sub: Stripe.Subscription) {
  return {
    status: sub.status,
    priceIds: sub.items.data.map((item) => item.price.id),
  };
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<NextResponse> {
  if (session.mode !== "subscription") return NextResponse.json({ received: true });

  const companyId = session.client_reference_id ?? session.metadata?.company_id ?? null;
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
  if (!companyId || !customerId) {
    console.warn("[stripe-webhook] checkout session without company reference", session.id);
    return NextResponse.json({ ignored: true });
  }

  // Plan comes from the subscription status, not the session: async payment
  // methods can complete checkout with the subscription still `incomplete`
  // (it stays free until customer.subscription.updated flips it active).
  const subscriptionId =
    typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
  if (!subscriptionId) {
    console.warn("[stripe-webhook] subscription checkout without subscription", session.id);
    return NextResponse.json({ ignored: true });
  }
  const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
  const plan = planFromSubscription(subscriptionSnapshot(subscription));

  const supabase = createAdminClient();
  const { data: company, error } = await supabase
    .from("companies")
    .update({ plan, stripe_customer_id: customerId })
    .eq("id", companyId)
    .select("id, owner_id")
    .maybeSingle();
  if (error) throw error;
  if (!company) {
    console.warn("[stripe-webhook] unknown company", companyId);
    return NextResponse.json({ ignored: true });
  }

  // Authoritative funnel event (the client capture on the success page is
  // best-effort and consent-gated).
  const posthog = getPostHogServer();
  if (posthog) {
    posthog.capture({
      distinctId: company.owner_id,
      event: EVENTS.checkoutCompleted,
      properties: { plan, source: "webhook" },
    });
    await posthog.shutdown();
  }

  return NextResponse.json({ ok: true, plan });
}

async function handleSubscriptionChange(subscription: Stripe.Subscription): Promise<NextResponse> {
  // `deleted` arrives with status `canceled`, so planFromSubscription already
  // maps it (and every other inactive status) to 'free'.
  const plan = planFromSubscription(subscriptionSnapshot(subscription));
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

  const supabase = createAdminClient();
  const { data: byCustomer, error } = await supabase
    .from("companies")
    .update({ plan })
    .eq("stripe_customer_id", customerId)
    .select("id");
  if (error) throw error;
  if (byCustomer && byCustomer.length > 0) return NextResponse.json({ ok: true, plan });

  // Fallback: customer not linked yet (e.g. subscription created straight from
  // the Stripe dashboard) — resolve through the metadata set at checkout.
  const companyId = subscription.metadata?.company_id;
  if (companyId) {
    const { data: byMetadata, error: metadataError } = await supabase
      .from("companies")
      .update({ plan, stripe_customer_id: customerId })
      .eq("id", companyId)
      .select("id");
    if (metadataError) throw metadataError;
    if (byMetadata && byMetadata.length > 0) return NextResponse.json({ ok: true, plan });
  }

  console.warn("[stripe-webhook] subscription for unknown customer", customerId);
  return NextResponse.json({ ignored: true });
}
