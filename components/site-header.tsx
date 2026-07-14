import Link from "next/link";
import { t } from "@/lib/i18n";
import { Wordmark } from "@/components/wordmark";

/**
 * Public site header (Claude Design export "Landing hero"): the register-stamp
 * wordmark on the left, quiet text nav on the right. No primary button here so
 * the hero keeps the single primary CTA per screen (DESIGN_SYSTEM.md §6).
 */
export function SiteHeader() {
  return (
    <header className="border-b border-line bg-paper">
      <div className="mx-auto flex w-full max-w-[1080px] items-center justify-between gap-4 px-4 py-4 sm:px-8">
        <Link href="/" className="rounded-sm">
          <Wordmark />
        </Link>
        <nav className="flex items-center gap-5 text-2xs">
          <Link
            href="/prezzi"
            className="rounded-sm font-display font-semibold text-muted-foreground hover:text-ink"
          >
            {t("landing.nav.prezzi")}
          </Link>
          <Link
            href="/login"
            className="rounded-sm font-display font-semibold text-brand hover:text-brand-hover"
          >
            {t("landing.nav.login")}
          </Link>
        </nav>
      </div>
    </header>
  );
}
