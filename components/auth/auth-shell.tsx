import Link from "next/link";
import { t } from "@/lib/i18n";
import { SiteFooter } from "@/components/site-footer";

/**
 * Centered card layout for the auth screens (login / signup / reset). Quiet and
 * institutional (DESIGN_SYSTEM.md §2), with the brand lockup and the fixed
 * legal footer (§8.13).
 */
export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="mx-auto w-full max-w-[1080px] px-4 pt-6 sm:px-8">
        <Link href="/" className="inline-flex items-center gap-2.5 rounded-sm">
          <span aria-hidden="true" className="inline-block h-3 w-3 rounded-[3px] bg-brand" />
          <span className="font-display text-2xs font-bold uppercase tracking-[0.1em] text-ink">
            {t("common.appName")}
          </span>
        </Link>
      </header>
      <main className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center px-4 py-12 sm:px-8">
        {eyebrow && <p className="eyebrow text-muted-foreground">{eyebrow}</p>}
        <h1
          className={`font-display text-2xl font-bold tracking-tightDisplay text-ink${
            eyebrow ? " mt-2" : ""
          }`}
        >
          {title}
        </h1>
        {subtitle && <p className="mt-2 text-base text-muted-foreground">{subtitle}</p>}
        <div className="mt-8">{children}</div>
        {footer && <div className="mt-6 text-2xs text-muted-foreground">{footer}</div>}
      </main>
      <SiteFooter />
    </div>
  );
}
