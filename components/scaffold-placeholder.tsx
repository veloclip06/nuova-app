import { t } from "@/lib/i18n";

/**
 * Minimal, tokenised placeholder used by the route scaffolding (PROMPT 1).
 * Real UI is built in later prompts — this only proves the route exists and the
 * design tokens/fonts are wired. Kept deliberately quiet (DESIGN_SYSTEM.md §2).
 */
export function ScaffoldPlaceholder({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-3xl flex-col justify-center px-8 py-16">
      <p className="eyebrow text-muted-foreground">{eyebrow}</p>
      <h1 className="mt-3 font-display text-2xl font-bold tracking-tightDisplay">
        {title}
      </h1>
      {description && (
        <p className="mt-3 max-w-prose text-base text-muted-foreground">
          {description}
        </p>
      )}
      <p className="mt-8 font-mono text-2xs text-muted-foreground">
        placeholder · {t("common.appName")}
      </p>
    </main>
  );
}
