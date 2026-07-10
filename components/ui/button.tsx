import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Button — shadcn/ui base tokenised with DESIGN_SYSTEM.md.
 * Max 1 primary CTA per screen (§6); secondaries are outline/ghost.
 * Labels use display font (Archivo) as in the Claude Design export.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-display font-semibold text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:translate-y-px disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-brand text-primary-foreground border border-brand hover:bg-brand-hover hover:border-brand-hover",
        outline:
          "border border-brand text-brand bg-transparent hover:bg-brand/[0.06]",
        ghost: "text-brand hover:bg-brand/[0.06]",
        destructive:
          "bg-risk text-destructive-foreground hover:bg-risk/90",
      },
      size: {
        default: "h-11 px-5 py-3",
        sm: "h-9 px-4",
        lg: "h-12 px-6",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
