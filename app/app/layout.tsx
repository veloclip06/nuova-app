import Link from "next/link";
import { t } from "@/lib/i18n";

/**
 * Authenticated app shell (/app/*). Familiar sidebar pattern (DESIGN_SYSTEM.md
 * §8.4 — Jakob's law). Auth guard + real navigation are wired in PROMPT 5.
 */
const NAV = [
  { href: "/app", key: "nav.dashboard" },
  { href: "/app/prodotti", key: "nav.prodotti" },
  { href: "/app/report", key: "nav.report" },
  { href: "/app/impostazioni", key: "nav.impostazioni" },
] as const;

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 border-r border-line bg-surface md:block">
        <div className="flex items-center gap-2 px-6 py-5">
          <span className="block h-3 w-3 rounded-[3px] bg-brand" />
          <span className="font-display text-2xs font-bold uppercase tracking-register">
            {t("common.appName")}
          </span>
        </div>
        <nav className="flex flex-col gap-0.5 px-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-xs text-foreground hover:bg-paper"
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex-1">{children}</div>
    </div>
  );
}
