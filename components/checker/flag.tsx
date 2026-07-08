import { cn } from "@/lib/utils";

/**
 * CSS-gradient flag swatches, exactly as in the Claude Design export (no image
 * assets). Codes without a gradient fall back to a neutral `line` swatch.
 * Always decorative — the country name is the accessible label.
 */
const FLAG_GRADIENTS: Record<string, string> = {
  DE: "linear-gradient(180deg,#1d1d1b 0%,#1d1d1b 33.4%,#c8102e 33.4%,#c8102e 66.7%,#ffcc00 66.7%,#ffcc00 100%)",
  FR: "linear-gradient(90deg,#003d8f 0%,#003d8f 33.4%,#ffffff 33.4%,#ffffff 66.7%,#e1000f 66.7%,#e1000f 100%)",
  IT: "linear-gradient(90deg,#008c45 0%,#008c45 33.4%,#ffffff 33.4%,#ffffff 66.7%,#cd212a 66.7%,#cd212a 100%)",
  ES: "linear-gradient(180deg,#aa151b 0%,#aa151b 25%,#f1bf00 25%,#f1bf00 75%,#aa151b 75%,#aa151b 100%)",
  NL: "linear-gradient(180deg,#ae1c28 0%,#ae1c28 33.4%,#ffffff 33.4%,#ffffff 66.7%,#21468b 66.7%,#21468b 100%)",
  AT: "linear-gradient(180deg,#ed2939 0%,#ed2939 33.4%,#ffffff 33.4%,#ffffff 66.7%,#ed2939 66.7%,#ed2939 100%)",
  PL: "linear-gradient(180deg,#ffffff 0%,#ffffff 50%,#dc143c 50%,#dc143c 100%)",
  BE: "linear-gradient(90deg,#1d1d1b 0%,#1d1d1b 33.4%,#fdda24 33.4%,#fdda24 66.7%,#ef3340 66.7%,#ef3340 100%)",
  IE: "linear-gradient(90deg,#169b62 0%,#169b62 33.4%,#ffffff 33.4%,#ffffff 66.7%,#ff883e 66.7%,#ff883e 100%)",
};

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
