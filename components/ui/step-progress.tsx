import { cn } from "@/lib/utils";

/**
 * Segmented endowed-progress bar shared by the wizard headers — one segment per
 * step, so progress is countable at a glance (DESIGN_SYSTEM.md §8.2). Decorative:
 * the visible mono "Passo n di N" carries the semantics, so it's aria-hidden.
 * Height and width come from `className` so each header keeps its own layout.
 */
export function StepProgress({
  step,
  total,
  className,
}: {
  step: number;
  total: number;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn("grid gap-px", className)}
      style={{ gridTemplateColumns: `repeat(${total}, 1fr)` }}
    >
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={cn(
            "h-full transition-colors duration-150",
            i < step ? "bg-brand" : "bg-line",
          )}
        />
      ))}
    </div>
  );
}
