import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Status pill — Plex Mono, uppercase, semantic colour (DESIGN_SYSTEM.md §3-4).
 * Used for the "prossime scadenze" state pills. `tone` is semantic: `risk`/
 * `warn` only for real risk/urgency (§3 — se tutto è urgente, niente lo è).
 */
const badgeVariants = cva(
  "inline-flex items-center rounded-full font-mono text-[11px] font-semibold uppercase tracking-[0.1em]",
  {
    variants: {
      tone: {
        ok: "text-ok",
        warn: "text-warn",
        risk: "text-risk",
        brand: "text-brand",
        neutral: "text-muted-foreground",
      },
      filled: {
        true: "px-2.5 py-0.5",
        false: "",
      },
    },
    compoundVariants: [
      { filled: true, tone: "ok", className: "bg-ok/[0.08]" },
      { filled: true, tone: "warn", className: "bg-warn/[0.08]" },
      { filled: true, tone: "risk", className: "bg-risk/[0.08]" },
      { filled: true, tone: "brand", className: "bg-brand/[0.08]" },
      { filled: true, tone: "neutral", className: "bg-muted-foreground/[0.08]" },
    ],
    defaultVariants: { tone: "neutral", filled: false },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, tone, filled, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone, filled }), className)} {...props} />;
}

export { Badge, badgeVariants };
