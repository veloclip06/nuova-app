import type { CompanyCountryStatus, CountryObligation } from "@/lib/engine/types";
import type { SealStatus } from "@/components/seal";

/**
 * Dashboard seal state = legal obligation (from the engine) combined with the
 * company's registration status (which the public checker never knows). This
 * extends lib/checker/seal-status.ts `sealStatusFor` — the ratified rule
 * (2026-07-07) that a foreign obligated country is ESPOSTO and a domestic one
 * AZIONE RICHIESTA — with the two registration-aware states the app adds:
 *
 *   - registered   → CONFORME       (the emotional reward, DESIGN_SYSTEM.md §5)
 *   - in_progress  → AZIONE RICHIESTA (started but not done — action still open;
 *                    never green, never risk: honest endowed progress §8.2)
 *   - not_registered & obligated → ESPOSTO (foreign) / AZIONE RICHIESTA (domestic)
 *   - not obligated → NON OBBLIGATO (informational; never green, §5)
 */
export function dashboardSealFor(
  obligation: CountryObligation,
  status: CompanyCountryStatus,
): SealStatus {
  if (!obligation.obligated) return "non_obbligato";
  if (status === "registered") return "conforme";
  if (status === "in_progress") return "azione_richiesta";
  return obligation.domestic ? "azione_richiesta" : "esposto";
}

/** A country counts as "configured" (progress banner §8.2) once action has started. */
export function isConfigured(status: CompanyCountryStatus): boolean {
  return status === "in_progress" || status === "registered";
}

/** Seal → semantic pill tone (DESIGN_SYSTEM.md §3). `non_obbligato` is neutral, never green. */
export function sealTone(seal: SealStatus): "ok" | "warn" | "risk" | "neutral" {
  switch (seal) {
    case "conforme":
      return "ok";
    case "azione_richiesta":
      return "warn";
    case "esposto":
      return "risk";
    default:
      return "neutral";
  }
}
