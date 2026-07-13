/** Page header — eyebrow + title (+ optional subtitle and right-aligned actions).
 * Reused across /app views for a consistent "registro" heading (DESIGN_SYSTEM.md §4). */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow: string;
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <p className="eyebrow text-muted-foreground">{eyebrow}</p>
        <h1 className="mt-2 font-display text-2xl font-bold tracking-tightDisplay text-ink">
          {title}
        </h1>
        {subtitle && <p className="mt-2 max-w-prose text-base text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
