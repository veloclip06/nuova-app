"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { SiteFooter } from "@/components/site-footer";
import { Wordmark } from "@/components/wordmark";

/**
 * Authenticated app shell (/app/*) — familiar sidebar pattern (DESIGN_SYSTEM.md
 * §8.4, Jakob's law): the originality lives in the seal and typography, not the
 * navigation. Active item, mobile drawer and sign-out live here.
 */
interface NavItem {
  href: string;
  key: string;
  exact?: boolean;
}

const NAV: NavItem[] = [
  { href: "/app", key: "nav.dashboard", exact: true },
  { href: "/app/paesi", key: "nav.paesi" },
  { href: "/app/prodotti", key: "nav.prodotti" },
  { href: "/app/report", key: "nav.report" },
  { href: "/app/piano", key: "nav.piano" },
  { href: "/app/impostazioni", key: "nav.impostazioni" },
];

export function AppShell({
  companyName,
  children,
}: {
  companyName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  // Close the mobile drawer on navigation.
  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const nav = (
    <nav className="flex flex-col gap-0.5">
      {NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "rounded-md px-3 py-2 text-xs transition-colors",
            isActive(item)
              ? "bg-brand/[0.08] font-display font-semibold text-brand"
              : "text-ink hover:bg-ink/[0.05]",
          )}
          aria-current={isActive(item) ? "page" : undefined}
        >
          {t(item.key)}
        </Link>
      ))}
    </nav>
  );

  const brand = <Wordmark />;

  return (
    <div className="flex min-h-screen bg-paper">
      {/* Desktop sidebar */}
      <aside className="hidden w-[220px] shrink-0 flex-col justify-between border-r border-line bg-surface px-3 py-6 md:flex">
        <div className="flex flex-col gap-7">
          <div className="px-3">{brand}</div>
          {nav}
        </div>
        <div className="flex flex-col gap-2 px-1">
          <p className="truncate px-2 text-2xs text-muted-foreground" title={companyName}>
            {companyName}
          </p>
          <button
            type="button"
            onClick={signOut}
            className="rounded-md px-3 py-2 text-left text-xs text-ink transition-colors hover:bg-ink/[0.05]"
          >
            {t("nav.signout")}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="flex items-center justify-between border-b border-line bg-surface px-5 py-3 md:hidden">
          {brand}
          <button
            type="button"
            aria-expanded={open}
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
            className="rounded-md p-2 text-ink hover:bg-ink/[0.05]"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
              {open ? <path d="M5 5l10 10M15 5L5 15" /> : <path d="M3 6h14M3 10h14M3 14h14" />}
            </svg>
          </button>
        </header>
        {open && (
          <div className="border-b border-line bg-surface px-3 py-3 md:hidden">
            {nav}
            <button
              type="button"
              onClick={signOut}
              className="mt-1 w-full rounded-md px-3 py-2 text-left text-xs text-ink hover:bg-ink/[0.05]"
            >
              {t("nav.signout")}
            </button>
          </div>
        )}

        {children}
        <SiteFooter />
      </div>
    </div>
  );
}
