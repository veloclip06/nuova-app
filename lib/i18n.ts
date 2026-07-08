import it from "@/locales/it.json";

/**
 * Minimal localization accessor. Italian is the MVP language (DESIGN_SYSTEM.md §9)
 * but every string lives in a locale file from day one so English can follow.
 */
const dictionaries = { it } as const;

export type Locale = keyof typeof dictionaries;
export const defaultLocale: Locale = "it";

/** Resolve a dotted key path to its raw value (string, array, object, …). */
export function tRaw(key: string, locale: Locale = defaultLocale): unknown {
  const dict = dictionaries[locale] as Record<string, unknown>;
  return key.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object" && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, dict);
}

/** Resolve a dotted key path, e.g. t("check.resultTitle"). Interpolates {{vars}}. */
export function t(
  key: string,
  vars?: Record<string, string | number>,
  locale: Locale = defaultLocale,
): string {
  const value = tRaw(key, locale);
  if (typeof value !== "string") return key;
  if (!vars) return value;
  return value.replace(/\{\{(\w+)\}\}/g, (_, name) =>
    name in vars ? String(vars[name]) : `{{${name}}}`,
  );
}

/**
 * Resolve a key path expected to hold a list. Used for content that is a list
 * by nature (pricing features, FAQ items, landing sections) — the strings still
 * live in the locale file (DESIGN_SYSTEM.md §9), this only reads them typed.
 */
export function tList<T = string>(key: string, locale: Locale = defaultLocale): T[] {
  const value = tRaw(key, locale);
  return Array.isArray(value) ? (value as T[]) : [];
}
