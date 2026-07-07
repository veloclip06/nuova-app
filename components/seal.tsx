import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Seal (sigillo di stato) — the product's visual signature (DESIGN_SYSTEM.md §5).
 * A double-bordered stamp with the status label + verification date in Plex Mono.
 *
 * States:
 *  - conforme        → ok    (CONFORME)
 *  - azione_richiesta → warn  (AZIONE RICHIESTA)
 *  - esposto         → risk  (ESPOSTO)
 *  - non_obbligato   → neutral: `line` border, `ink` text. Informational
 *                      "does not apply" — never rendered in green (§5).
 *
 * The stamp reveal (`animate` prop) runs ~300ms and respects
 * prefers-reduced-motion via the global CSS rule in app/globals.css.
 */
export type SealStatus =
  | "conforme"
  | "azione_richiesta"
  | "esposto"
  | "non_obbligato";

const STATUS_LABEL: Record<SealStatus, string> = {
  conforme: "CONFORME",
  azione_richiesta: "AZIONE RICHIESTA",
  esposto: "ESPOSTO",
  non_obbligato: "NON OBBLIGATO",
};

const STATUS_CLASSES: Record<SealStatus, string> = {
  conforme: "border-ok text-ok",
  azione_richiesta: "border-warn text-warn",
  esposto: "border-risk text-risk",
  non_obbligato: "border-line text-ink",
};

export interface SealProps extends React.HTMLAttributes<HTMLDivElement> {
  status: SealStatus;
  /** Verification / effective date, shown in Plex Mono under the label. */
  date?: string;
  /** Slight rotation (deg) for the hand-stamped look, as in the design export. */
  tilt?: number;
  /** Play the stamp reveal animation. */
  animate?: boolean;
}

const Seal = React.forwardRef<HTMLDivElement, SealProps>(
  ({ status, date, tilt = 0, animate = false, className, style, ...props }, ref) => {
    const color = STATUS_CLASSES[status];
    return (
      <div
        ref={ref}
        role="status"
        aria-label={STATUS_LABEL[status]}
        className={cn(
          "inline-block self-start rounded-md border-2 p-[3px]",
          color,
          animate && "animate-stamp",
          className,
        )}
        style={{
          transform: tilt ? `rotate(${tilt}deg)` : undefined,
          // consumed by the stamp keyframes so rotation is preserved mid-animation
          ["--stamp-tilt" as string]: `${tilt}deg`,
          ...style,
        }}
        {...props}
      >
        <div className="flex flex-col items-center gap-0.5 rounded-sm border p-[7px_16px]">
          <span className="font-mono font-semibold text-xs tracking-[0.14em]">
            {STATUS_LABEL[status]}
          </span>
          {date && (
            <span className="font-mono text-[11px] tracking-[0.06em]">
              {date}
            </span>
          )}
        </div>
      </div>
    );
  },
);
Seal.displayName = "Seal";

export { Seal, STATUS_LABEL as SEAL_LABELS };
