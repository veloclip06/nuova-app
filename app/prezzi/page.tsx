import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PricingSection } from "@/components/landing/pricing";
import { t } from "@/lib/i18n";

// Pricing page (ARCHITECTURE.md §2, §8) — reuses the landing PricingSection so
// the two annual tiers stay in one place. Stripe checkout is wired in PROMPT 6.
export const metadata: Metadata = {
  title: t("meta.prezzi.title"),
  description: t("meta.prezzi.description"),
  alternates: { canonical: "/prezzi" },
  openGraph: {
    title: t("meta.prezzi.title"),
    description: t("meta.prezzi.description"),
    url: "/prezzi",
  },
};

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <SiteHeader />
      <main className="flex-1">
        <PricingSection />
      </main>
      <SiteFooter />
    </div>
  );
}
