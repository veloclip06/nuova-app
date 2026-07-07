import { ScaffoldPlaceholder } from "@/components/scaffold-placeholder";

// Report per paese/periodo → computeReport → breakdown per materiale. PROMPT 5.
export default function ReportPage() {
  return (
    <ScaffoldPlaceholder
      eyebrow="Report"
      title="Genera report per paese e periodo"
      description="Breakdown per materiale in Plex Mono, copia negli appunti ed export CSV."
    />
  );
}
