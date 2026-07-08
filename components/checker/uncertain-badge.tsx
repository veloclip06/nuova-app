import { t } from "@/lib/i18n";

/**
 * Sober "in verifica" marker for engine-flagged uncertain data (addendum §2,
 * DESIGN_SYSTEM.md §8.13): declared, never hidden, never alarming — muted ink
 * on neutral border, no red tones.
 */
export function UncertainBadge() {
  return (
    <span className="ml-1.5 inline-block whitespace-nowrap rounded-sm border border-line bg-paper px-1.5 py-px align-middle font-mono text-[11px] leading-relaxed text-muted-foreground">
      {t("check.result.inVerifica")}
    </span>
  );
}
