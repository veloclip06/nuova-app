import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Hero } from "@/components/landing/hero";
import { PainSection } from "@/components/landing/pain";
import { HowItWorks } from "@/components/landing/how-it-works";
import { PricingSection } from "@/components/landing/pricing";
import { FaqSection } from "@/components/landing/faq";
import { getCoveredCountries } from "@/lib/rules/coverage";
import { t } from "@/lib/i18n";

// Landing (PROMPT 4) — hero, pain, how-it-works, pricing, FAQ. The single
// primary CTA lives in the hero; every path leads to the free checker.
// The register list in the description comes from /rules, never from copy.
const description = t("meta.home.description", {
  registers: getCoveredCountries()
    .map((c) => c.registerName)
    .join(", "),
});

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
      </main>
      <SiteFooter />
    </div>
  );
}
