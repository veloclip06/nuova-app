import { EU_MEMBER_STATES } from "@/lib/engine/eu-countries";
import {
  ALL_SELLING,
  CHANNEL_IDS,
  EXTRA_EU,
  PRODUCT_TYPE_IDS,
  VOLUME_BAND_IDS,
  type CheckerAnswers,
} from "./options";

/**
 * Answers ↔ query string for the /check → /check/risultato handoff
 * (ARCHITECTURE.md §6: answers live in local state, no login).
 *
 * Decoding is lenient — shared URLs survive option changes: unknown tokens are
 * filtered, codes normalised, duplicates dropped. Only a structurally invalid
 * URL (no establishment, nothing valid to sell/no channel) yields null, which
 * the result page turns into redirect("/check").
 *
 * Client-safe: validation is set-filtering against options.ts, no zod.
 */

const QUERY_KEYS = { establishment: "e", selling: "s", channels: "c", productTypes: "p", volumes: "v" } as const;

function toStringArray(value: unknown): string[] {
  if (typeof value === "string") return value.split(",");
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string").flatMap((v) => v.split(","));
  return [];
}

function filterKnown(raw: unknown, known: readonly string[], normalise: (s: string) => string): string[] {
  const seen = new Set<string>();
  for (const token of toStringArray(raw)) {
    const value = normalise(token.trim());
    if (value && known.includes(value)) seen.add(value);
  }
  return [...seen];
}

/**
 * Normalise loosely-typed answers (query params or a POSTed lead payload) into
 * a valid CheckerAnswers, or null when structurally invalid.
 */
export function sanitizeAnswers(raw: unknown): CheckerAnswers | null {
  if (typeof raw !== "object" || raw === null) return null;
  const input = raw as Record<string, unknown>;

  const establishment =
    typeof input.establishment === "string" ? input.establishment.trim().toUpperCase() : "";
  if (establishment !== EXTRA_EU && !EU_MEMBER_STATES.has(establishment)) return null;

  const selling = filterKnown(input.selling, ALL_SELLING, (s) => s.toUpperCase());
  const channels = filterKnown(input.channels, CHANNEL_IDS, (s) => s.toLowerCase());
  if (selling.length === 0 || channels.length === 0) return null;

  const productTypes = filterKnown(input.productTypes, PRODUCT_TYPE_IDS, (s) => s.toLowerCase());

  const volumeByCountry: Record<string, string> = {};
  if (typeof input.volumeByCountry === "object" && input.volumeByCountry !== null) {
    for (const [key, value] of Object.entries(input.volumeByCountry as Record<string, unknown>)) {
      const country = key.trim().toUpperCase();
      const band = typeof value === "string" ? value.trim().toLowerCase() : "";
      if (selling.includes(country) && (VOLUME_BAND_IDS as readonly string[]).includes(band)) {
        volumeByCountry[country] = band;
      }
    }
  }

  return { establishment, selling, channels, productTypes, volumeByCountry };
}

/** Compact query string, e.g. e=IT&s=DE,FR&c=amazon,shopify&p=fashion&v=DE:b2,FR:b1 */
export function encodeAnswers(answers: CheckerAnswers): string {
  const params = new URLSearchParams();
  params.set(QUERY_KEYS.establishment, answers.establishment);
  params.set(QUERY_KEYS.selling, answers.selling.join(","));
  params.set(QUERY_KEYS.channels, answers.channels.join(","));
  if (answers.productTypes.length > 0) params.set(QUERY_KEYS.productTypes, answers.productTypes.join(","));
  const volumes = Object.entries(answers.volumeByCountry)
    .map(([country, band]) => `${country}:${band}`)
    .join(",");
  if (volumes) params.set(QUERY_KEYS.volumes, volumes);
  return params.toString();
}

/** Parse the resolved Next.js searchParams; null → the caller redirects to /check. */
export function decodeAnswers(
  searchParams: Record<string, string | string[] | undefined>,
): CheckerAnswers | null {
  const first = (key: string): string | undefined => {
    const value = searchParams[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const volumeByCountry: Record<string, string> = {};
  for (const pair of (first(QUERY_KEYS.volumes) ?? "").split(",")) {
    const [country, band] = pair.split(":");
    if (!country || !band) continue;
    // drop unknown bands here so a junk duplicate ("DE:zz") can never
    // overwrite a valid pair before sanitizeAnswers validates countries
    const normalisedBand = band.trim().toLowerCase();
    if (!(VOLUME_BAND_IDS as readonly string[]).includes(normalisedBand)) continue;
    volumeByCountry[country] = normalisedBand;
  }

  return sanitizeAnswers({
    establishment: first(QUERY_KEYS.establishment),
    selling: first(QUERY_KEYS.selling),
    channels: first(QUERY_KEYS.channels),
    productTypes: first(QUERY_KEYS.productTypes),
    volumeByCountry,
  });
}
