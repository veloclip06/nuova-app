import type { Metadata } from "next";
import { CheckerWizard } from "@/components/checker/checker-wizard";
import { SiteFooter } from "@/components/site-footer";
import { getCoveredCountries } from "@/lib/rules/coverage";
import { t } from "@/lib/i18n";

// Coverage is derived from /rules at runtime — the metadata and the step-2
// microcopy list whatever countries have a rule file, never a constant.
const coveredNames = getCoveredCountries().map((c) => c.name);

export const metadata: Metadata = {
  title: t("meta.check.title"),
  description: t("meta.check.description", { countries: coveredNames.join(", ") }),
};

// Checker (5 step) — ARCHITECTURE.md §6. No login; answers live in client
// state inside CheckerWizard and reach the server only via the result URL.
export default function CheckPage() {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <CheckerWizard coveredNames={coveredNames} />
      <SiteFooter />
    </div>
  );
}
