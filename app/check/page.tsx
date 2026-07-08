import type { Metadata } from "next";
import { CheckerWizard } from "@/components/checker/checker-wizard";
import { SiteFooter } from "@/components/site-footer";
import { t } from "@/lib/i18n";

export const metadata: Metadata = {
  title: t("meta.check.title"),
  description: t("meta.check.description"),
};

// Checker (5 step) — ARCHITECTURE.md §6. No login; answers live in client
// state inside CheckerWizard and reach the server only via the result URL.
export default function CheckPage() {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <CheckerWizard />
      <SiteFooter />
    </div>
  );
}
