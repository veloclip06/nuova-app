"use server";

import { redirect } from "next/navigation";

import { getCompanyContext, getUser } from "@/lib/app/company";
import { isPaidPlan, normalizePlan } from "@/lib/plans";
import { getStripe } from "@/lib/stripe/client";
import { priceIdForPlan, type PaidPlanId } from "@/lib/stripe/prices";
import { createClient } from "@/lib/supabase/server";

export type CheckoutActionResult = { error: "config" | "stripe" } | void;

const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * Create a Stripe Checkout Session for one of the two annual plans and
 * redirect to it (purchase happens from /app only — ratified 2026-07-10).
 *
 * The Stripe customer is created BEFORE the session and persisted right away:
 * it makes every later webhook resolvable by stripe_customer_id even when
 * customer.subscription.updated arrives before checkout.session.completed.
 *
 * automatic_tax is intentionally NOT enabled: it requires Stripe Tax to be
 * configured by hand in the dashboard (Ion's step — STRIPE_SETUP.md). The VAT
 * number collected via tax_id_collection lands on the customer for invoicing.
 */
export async function startCheckout(plan: PaidPlanId): Promise<CheckoutActionResult> {
  if (plan !== "essenziale" && plan !== "completo") return { error: "config" };

  const context = await getCompanyContext();
  const user = await getUser();
  if (!context || !user) redirect("/login");
  const { company } = context;

  // Stale-tab defence: an already-subscribed company manages its plan through
  // the Customer Portal, never through a second checkout.
  if (isPaidPlan(normalizePlan(company.plan))) return openBillingPortal();

  const priceId = priceIdForPlan(plan);
  if (!priceId) return { error: "config" };

  let sessionUrl: string | null = null;
  try {
    const stripe = getStripe();

    let customerId = company.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: company.name,
        metadata: { company_id: company.id },
      });
      customerId = customer.id;
      // RLS companies_update_own: the action runs as the owner.
      const supabase = await createClient();
      await supabase
        .from("companies")
        .update({ stripe_customer_id: customerId })
        .eq("id", company.id);
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      // B2B: full billing address + VAT number (prices are VAT-excluded).
      billing_address_collection: "required",
      tax_id_collection: { enabled: true },
      // Required by Stripe when tax_id_collection is on with an existing customer.
      customer_update: { name: "auto", address: "auto" },
      client_reference_id: company.id,
      metadata: { company_id: company.id, plan },
      subscription_data: { metadata: { company_id: company.id } },
      locale: "it",
      success_url: `${siteUrl()}/app/piano?checkout=success`,
      cancel_url: `${siteUrl()}/app/piano?checkout=cancelled`,
    });
    sessionUrl = session.url;
  } catch (error) {
    console.error("[stripe-checkout]", error);
    return { error: "stripe" };
  }

  if (!sessionUrl) return { error: "stripe" };
  redirect(sessionUrl);
}

/**
 * Send a subscribed company to the Stripe Customer Portal (plan switch,
 * cancellation, invoices — no custom billing UI, ARCHITECTURE §2).
 */
export async function openBillingPortal(): Promise<CheckoutActionResult> {
  const context = await getCompanyContext();
  if (!context) redirect("/login");
  const customerId = context.company.stripe_customer_id;
  if (!customerId) return { error: "stripe" };

  let portalUrl: string | null = null;
  try {
    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${siteUrl()}/app/piano`,
    });
    portalUrl = session.url;
  } catch (error) {
    console.error("[stripe-portal]", error);
    return { error: "stripe" };
  }

  redirect(portalUrl);
}
