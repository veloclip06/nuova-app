import { ScaffoldPlaceholder } from "@/components/scaffold-placeholder";

// Pricing (3 tier) — ARCHITECTURE.md §8. Real UI in PROMPT 4 / Stripe in PROMPT 6.
export default function PricingPage() {
  return (
    <ScaffoldPlaceholder
      eyebrow="Prezzi"
      title="Tre piani, nessuna telefonata"
      description="Free · Starter 29€ · Pro 59€. Dettaglio e checkout in arrivo."
    />
  );
}
