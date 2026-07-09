import { EU_MEMBER_STATES } from "@/lib/engine/eu-countries";
import type { CheckerInput } from "@/lib/engine/types";

/**
 * Single source for the checker's step taxonomy (ARCHITECTURE.md §6).
 * Ids are stable English tokens: they travel in URLs, leads and analytics.
 * Italian labels live in locales/it.json under the key builders below.
 *
 * Client-safe: no engine barrel, no fs, no zod — the wizard bundles this file.
 */

export interface CheckerAnswers {
  /** ISO 3166-1 alpha-2 code, or EXTRA_EU for companies outside the EU. */
  establishment: string;
  /** ISO codes among EU_COUNTRIES (all 27 — coverage is data, not taxonomy). */
  selling: string[];
  /** Channel ids among CHANNEL_IDS. */
  channels: string[];
  /** Product type ids among PRODUCT_TYPE_IDS (informational for the engine). */
  productTypes: string[];
  /** Selling country code → volume band id (informational for the engine). */
  volumeByCountry: Record<string, string>;
}

export const TOTAL_STEPS = 5;

/**
 * Sentinel for "established outside the EU". ZZ is a user-assigned ISO 3166-1
 * code, so it can never collide with a real country; the engine only compares
 * it for equality (never domestic) and isEuMember("ZZ") is false.
 */
export const EXTRA_EU = "ZZ";

/**
 * Steps 1 and 2 — all 27 EU member states, one uniform list (components sort
 * by Italian label). No country is visually privileged: which countries get a
 * detailed analysis is derived at runtime from the loaded /rules files
 * (lib/rules/coverage.ts), never from constants here.
 */
export const EU_COUNTRIES: readonly string[] = [...EU_MEMBER_STATES];

/** Step 3 — matches MARKETPLACE_CHANNELS in the engine ("amazon"/"ebay"). */
export const CHANNEL_IDS = ["amazon", "ebay", "shopify", "other"] as const;

/** Step 4 — max 6 options (Hick's law, DESIGN_SYSTEM.md §8.5). */
export const PRODUCT_TYPE_IDS = [
  "fashion",
  "cosmetics",
  "electronics",
  "home",
  "food",
  "other",
] as const;

/** Step 5 — 4 bands + "non lo so" (never force a guess). */
export const VOLUME_BAND_IDS = ["b1", "b2", "b3", "b4", "unknown"] as const;

/** it.json key builders shared by components and tests. */
export const optionKeys = {
  country: (code: string) => `countries.${code}`,
  channel: (id: string) => `check.options.channels.${id}`,
  productType: (id: string) => `check.options.productTypes.${id}`,
  volume: (id: string) => `check.options.volumes.${id}`,
} as const;

/** Map wizard answers to the engine's input ("today" stays an explicit input). */
export function toCheckerInput(
  answers: CheckerAnswers,
  referenceDate: string,
): CheckerInput {
  return {
    establishmentCountry: answers.establishment,
    sellingCountries: [...answers.selling],
    channels: [...answers.channels],
    productTypes: [...answers.productTypes],
    volumeBandByCountry: { ...answers.volumeByCountry },
    referenceDate,
  };
}
