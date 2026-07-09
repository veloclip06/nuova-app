import { cn } from "@/lib/utils";
import { FLAG_GRADIENTS } from "@/lib/checker/flags";

/**
 * Decorative CSS-gradient flag swatch (lib/checker/flags.ts holds the
 * gradients for all 27 EU states). Codes without a gradient — the EXTRA_EU
 * sentinel — fall back to a neutral `line` swatch. The country name next to
 * the swatch is the accessible label.
 */

export interface FlagProps {
  code: string;
  /** "sm" = 22×15 (result cards, pills) · "md" = 34×24 (step option cards). */
  size?: "sm" | "md";
  className?: string;
}

export function Flag({ code, size = "sm", className }: FlagProps) {
  const gradient = FLAG_GRADIENTS[code.toUpperCase()];
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-block shrink-0 rounded-[3px] border border-ink/10",
        size === "md" ? "h-6 w-[34px]" : "h-[15px] w-[22px]",
        !gradient && "bg-line",
        className,
      )}
      style={gradient ? { background: gradient } : undefined}
    />
  );
}
