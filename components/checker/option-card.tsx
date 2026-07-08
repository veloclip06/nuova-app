"use client";

import { cn } from "@/lib/utils";
import { Flag } from "./flag";

/**
 * Selectable option card (design export "Checker passo 2"). A real form
 * control — a visually hidden checkbox/radio inside a label — so keyboard
 * and screen-reader semantics come from the platform, not ARIA re-invention.
 * The focus ring surfaces on the card via the :has() variant.
 */
export interface OptionCardProps {
  type: "checkbox" | "radio";
  name: string;
  value: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  /** Mono sublabel, e.g. "Registro LUCID" (presentational, it.json). */
  sublabel?: string;
  flagCode?: string;
  /** Denser variant for the "Altri paesi" secondary grid. */
  compact?: boolean;
}

function CheckGlyph({ checked, compact }: { checked: boolean; compact: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-[6px] border transition-colors",
        compact ? "h-[18px] w-[18px]" : "h-[22px] w-[22px]",
        checked ? "border-brand bg-brand text-primary-foreground" : "border-line bg-surface",
      )}
    >
      {checked && (
        <svg viewBox="0 0 12 12" className={compact ? "h-2.5 w-2.5" : "h-3 w-3"} fill="none">
          <path d="M2.5 6.5 5 9l4.5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  );
}

export function OptionCard({
  type,
  name,
  value,
  checked,
  onChange,
  label,
  sublabel,
  flagCode,
  compact = false,
}: OptionCardProps) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-lg border bg-surface transition-colors",
        "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-background",
        checked
          ? "border-brand shadow-[inset_0_0_0_1px_var(--brand)]"
          : "border-line hover:border-brand",
        compact ? "px-3 py-2.5" : "p-4",
      )}
    >
      <input
        type={type}
        name={name}
        value={value}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="sr-only"
      />
      {flagCode && <Flag code={flagCode} size={compact ? "sm" : "md"} />}
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block font-display font-semibold text-ink",
            compact ? "text-xs" : "text-base",
          )}
        >
          {label}
        </span>
        {sublabel && (
          <span className="mt-0.5 block truncate font-mono text-[12px] text-muted-foreground">
            {sublabel}
          </span>
        )}
      </span>
      <CheckGlyph checked={checked} compact={compact} />
    </label>
  );
}
