import { cn } from "@/lib/utils";

/**
 * Loading placeholder block — DESIGN_SYSTEM.md §10 requires a loading state
 * for every data view. Opacity-only pulse on the `line` token: system-state
 * feedback (§8.12), not decorative motion (§7). The global
 * prefers-reduced-motion rule in globals.css freezes it.
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-line/60", className)}
      {...props}
    />
  );
}

export { Skeleton };
