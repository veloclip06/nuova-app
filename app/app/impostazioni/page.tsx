import { ScaffoldPlaceholder } from "@/components/scaffold-placeholder";

// Company + subscription (link to Stripe Portal). Built in PROMPT 5 / 6.
export default function SettingsPage() {
  return (
    <ScaffoldPlaceholder
      eyebrow="Impostazioni"
      title="Azienda e abbonamento"
      description="Dati azienda e gestione abbonamento (Stripe Customer Portal)."
    />
  );
}
