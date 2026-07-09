import * as React from "react";
import { cn } from "@/lib/utils";

/** Form label — sentence case, quiet (DESIGN_SYSTEM.md §9). */
const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn("block text-2xs font-medium text-ink", className)}
      {...props}
    />
  ),
);
Label.displayName = "Label";

export { Label };
