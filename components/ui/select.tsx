import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Select — styled native <select> (as used across the checker). Native keeps
 * the mobile picker and full keyboard/AA behaviour without a JS dependency
 * (DESIGN_SYSTEM.md §10). A caret is drawn via background image.
 */
const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "h-11 w-full appearance-none rounded-md border border-line bg-surface px-3.5 pr-9 text-base text-ink",
        "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2016%2016%22%20fill%3D%22none%22%20stroke%3D%22%235a6b76%22%20stroke-width%3D%221.5%22%3E%3Cpath%20d%3D%22M4%206l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  ),
);
Select.displayName = "Select";

export { Select };
