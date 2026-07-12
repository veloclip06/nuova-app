import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Hero } from "@/components/landing/hero";
import { PainSection } from "@/components/landing/pain";
import { HowItWorks } from "@/components/landing/how-it-works";
import { PricingSection } from "@/components/landing/pricing";
import { FaqSection } from "@/components/landing/faq";
import { FinalCta } from "@/components/landing/final-cta";
import { t } from "@/lib/i18n";

// Landing (PROMPT 4) — hero, pain, how-it-works, pricing, FAQ, closing CTA.
// The primary CTA lives in the hero and repeats once at the page end (same
// action, ratified 11/07/2026); every path leads to the free checker.
// EU-neutral copy (decision ratified 2026-07-10): no country or register is
// named here — detailed coverage is disclosed in the FAQ from /rules data.
const description = t("meta.home.description");

export const metadata: Metadata = {
  title: { absolute: t("meta.home.title") },
  description,
  alternates: { canonical: "/" },
  openGraph: {
    title: t("meta.home.title"),
    description,
    url: "/",
  },
};

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <PainSection />
        <HowItWorks />
        <PricingSection />
        <FaqSection />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}
