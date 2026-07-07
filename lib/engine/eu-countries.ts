/**
 * EU member states, ISO 3166-1 alpha-2 (27, post-Brexit).
 *
 * This is a stable geographic/political fact, not a normative EPR value —
 * normative values live exclusively in /rules/*.yaml. The engine only uses it
 * to distinguish EU from non-EU establishment (authorised-representative
 * nuances in the YAML notes differ for extra-EU producers).
 */
export const EU_MEMBER_STATES: ReadonlySet<string> = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR",
  "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL",
  "PL", "PT", "RO", "SK", "SI", "ES", "SE",
]);

export function isEuMember(countryCode: string): boolean {
  return EU_MEMBER_STATES.has(countryCode.toUpperCase());
}
