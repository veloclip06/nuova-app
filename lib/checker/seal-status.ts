import type { CountryObligation } from "@/lib/engine/types";
import type { SealStatus } from "@/components/seal";

/**
 * CountryObligation → seal state. The engine exposes facts; this is the UI's
 * single mapping, ratified 2026-07-07 (supersedes the design export):
 *
 *   The seal reflects the LEGAL status; risk claims reflect confirmed
 *   enforcement. A foreign obligated country is ESPOSTO regardless of channel
 *   — sanctions apply by law from the first unit sold, so `riskLevel`
 *   modulates the risk-factor lines on the card, never the seal. The domestic
 *   case is AZIONE RICHIESTA with dedicated copy (the CAC nuance: often
 *   already paid upstream — "verifica la tua posizione", not "esposto").
 *
 * "conforme" is unreachable from the checker: it never asks whether the
 * company is already registered (the result page declares that assumption).
 */
export function sealStatusFor(obligation: CountryObligation): SealStatus {
  if (!obligation.obligated) return "non_obbligato";
  if (obligation.domestic) return "azione_richiesta";
  return "esposto";
}
