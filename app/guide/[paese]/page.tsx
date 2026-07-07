import { notFound } from "next/navigation";
import { ScaffoldPlaceholder } from "@/components/scaffold-placeholder";
import { loadRuleFile, listRuleFiles } from "@/lib/rules/load";

// Per-country SEO guide, generated from /rules. Real content in a later phase.
export function generateStaticParams() {
  return listRuleFiles().map((f) => ({ paese: f.replace(/\.ya?ml$/, "") }));
}

export default async function CountryGuidePage({
  params,
}: {
  params: Promise<{ paese: string }>;
}) {
  const { paese } = await params;
  const { rule } = loadRuleFile(`${paese}.yaml`);
  if (!rule) notFound();

  return (
    <ScaffoldPlaceholder
      eyebrow={`Guida paese · ${rule.country_code}`}
      title={`EPR imballaggi — ${rule.country_name}`}
      description={`Registro: ${rule.register.name}. Guida SEO generata dai file /rules. Contenuto completo in arrivo.`}
    />
  );
}
