import * as React from "react";

/**
 * Render numeric runs of a copy string in IBM Plex Mono — "i numeri sono il
 * prodotto" (DESIGN_SYSTEM.md §4). Grouped amounts ("200.000", "5,16") and
 * ordinals ("1°") stay in a single mono run; the surrounding prose keeps the
 * body font. Presentation-only: the text content is unchanged.
 */
const NUMBER_RUN = /(\d+(?:[.,]\d+)*°?)/;

export function MonoDigits({ text }: { text: string }) {
  return (
    <>
      {text.split(NUMBER_RUN).map((part, i) =>
        NUMBER_RUN.test(part) ? (
          <span key={i} className="font-mono text-[0.94em]">
            {part}
          </span>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        ),
      )}
    </>
  );
}
