import Link from "next/link";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

/** Root 404 (DESIGN_SYSTEM.md §10 — error states are part of the floor). */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-4">
      <p className="font-mono text-2xs text-muted-foreground">404</p>
      <h1 className="mt-2 font-display text-2xl font-bold tracking-tightDisplay text-ink">
        {t("notFound.title")}
      </h1>
      <p className="mt-3 max-w-prose text-center text-base text-muted-foreground">
        {t("notFound.body")}
      </p>
      <Button asChild variant="outline" className="mt-6">
        <Link href="/">{t("notFound.cta")}</Link>
      </Button>
    </div>
  );
}
