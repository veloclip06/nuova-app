import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

/**
 * Brand lockup — the register-stamp mark plus the wordmark (DESIGN_SYSTEM.md §2,
 * §4). Single source of truth so header, app shell, auth and the legal pages
 * stay identical. Renders only the mark: callers wrap it in a Link when it
 * should navigate home. The 0.1em tracking is the deliberate wordmark spacing
 * (wider than the 0.08em register eyebrow).
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span aria-hidden="true" className="inline-block h-3 w-3 rounded-[3px] bg-brand" />
      <span className="font-display text-2xs font-bold uppercase tracking-[0.1em] text-ink">
        {t("common.appName")}
      </span>
    </span>
  );
}
