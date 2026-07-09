import { formatDateIt } from "@/lib/checker/format";
import { t } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";

/**
 * "Prossime scadenze" list (dashboard export). Date in Plex Mono, country,
 * description, and a status pill coloured by the country's seal — semantic
 * colour only (DESIGN_SYSTEM.md §3).
 */
export interface DeadlineListItem {
  key: string;
  date: string | null;
  countryName: string;
  description: string;
  tone: "ok" | "warn" | "risk" | "neutral";
  pillLabel: string;
}

export function DeadlinesList({ items }: { items: DeadlineListItem[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      {items.map((item) => (
        <div
          key={item.key}
          className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-line px-5 py-3.5 last:border-0"
        >
          <span className="min-w-[92px] font-mono text-2xs font-semibold text-ink">
            {item.date ? formatDateIt(item.date) : t("app.dashboard.deadlines.undated")}
          </span>
          <span className="min-w-[80px] text-xs font-medium text-ink">{item.countryName}</span>
          <span className="min-w-[200px] flex-1 text-xs text-muted-foreground">
            {item.description}
          </span>
          <Badge tone={item.tone}>{item.pillLabel}</Badge>
        </div>
      ))}
    </div>
  );
}
