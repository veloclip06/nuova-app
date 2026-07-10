import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Input — shadcn/ui base tokenised with DESIGN_SYSTEM.md (1px `line` border,
 * 8px radius, keyboard focus ring from the quality floor §10). Inline
 * validation styling is opt-in via `aria-invalid` (§8.7 error prevention).
 */
const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        "h-11 w-full min-w-0 rounded-md border border-line bg-surface px-3.5 text-base text-ink",
        "transition-colors hover:border-ink/25",
        "placeholder:text-[color:var(--placeholder)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-[invalid=true]:border-risk aria-[invalid=true]:ring-risk/40",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export { Input };
