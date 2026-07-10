import Link from "next/link";
import { t } from "@/lib/i18n";

/**
 * Fixed legal footer (ARCHITECTURE.md §9, DESIGN_SYSTEM.md §8.13): the
 * disclaimer appears on every public screen, with the legal links.
 */
export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex w-full max-w-[1080px] flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-5 text-2xs text-muted-foreground sm:px-8">
        <p>{t("common.legalDisclaimer")}</p>
        <span className="flex items-center gap-4">
          <Link href="/privacy" className="rounded-sm text-brand hover:underline">
            {t("common.privacy")}
          </Link>
          <Link href="/termini" className="rounded-sm text-brand hover:underline">
            {t("common.termini")}
          </Link>
        </span>
      </div>
    </footer>
  );
}
