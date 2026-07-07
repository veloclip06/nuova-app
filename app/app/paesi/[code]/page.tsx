import { ScaffoldPlaceholder } from "@/components/scaffold-placeholder";

// Country detail: registrazione, scadenze, cosa serve. Built in PROMPT 5.
export default async function CountryDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return (
    <ScaffoldPlaceholder
      eyebrow={`Paese · ${code.toUpperCase()}`}
      title="Dettaglio paese"
      description="Registrazione, scadenze e cosa serve per questo paese."
    />
  );
}
