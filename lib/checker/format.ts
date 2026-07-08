/**
 * Presentation-only formatting helpers for the checker. Nothing here creates
 * or alters normative data — text from the YAML is segmented or reformatted
 * verbatim.
 */

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** "2026-07-06" → "06/07/2026"; anything else is returned unchanged. */
export function formatDateIt(isoDate: string): string {
  const match = ISO_DATE_RE.exec(isoDate);
  if (!match) return isoDate;
  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}

/**
 * Today as YYYY-MM-DD in Europe/Rome — the checker's referenceDate. Computed
 * in the product's timezone so a 00:30 check never shows yesterday's date.
 */
export function todayInRome(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export interface TextSegment {
  text: string;
  /** true → render in Plex Mono ("i numeri sono il prodotto", DESIGN_SYSTEM.md §4). */
  mono: boolean;
}

/** Euro amounts adjacent to "€", e.g. "200.000 €" or "€ 80". */
const FIGURE_RE = /(\d[\d.,]*\s?€|€\s?\d[\d.,]*)/g;

/**
 * Split sourced free text so € figures can render in mono, exactly as in the
 * design export ("Sanzioni fino a `200.000 €` …"). Purely presentational.
 */
export function segmentFigures(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let lastIndex = 0;
  for (const match of text.matchAll(FIGURE_RE)) {
    const index = match.index ?? 0;
    if (index > lastIndex) segments.push({ text: text.slice(lastIndex, index), mono: false });
    segments.push({ text: match[0], mono: true });
    lastIndex = index + match[0].length;
  }
  if (lastIndex < text.length) segments.push({ text: text.slice(lastIndex), mono: false });
  return segments.length > 0 ? segments : [{ text, mono: false }];
}
