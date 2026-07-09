import { describe, expect, it } from "vitest";
import type { CountryObligation } from "@/lib/engine/types";
import { dashboardSealFor, isConfigured } from "./seal";

/** dashboardSealFor only reads `obligated` and `domestic`; a minimal stub is enough. */
const obligation = (obligated: boolean, domestic: boolean): CountryObligation =>
  ({ obligated, domestic }) as CountryObligation;

describe("dashboardSealFor", () => {
  it("not obligated → non_obbligato regardless of status", () => {
    expect(dashboardSealFor(obligation(false, false), "not_registered")).toBe("non_obbligato");
    expect(dashboardSealFor(obligation(false, true), "registered")).toBe("non_obbligato");
    expect(dashboardSealFor(obligation(false, false), "in_progress")).toBe("non_obbligato");
  });

  it("registered + obligated → conforme (the reward), domestic or foreign", () => {
    expect(dashboardSealFor(obligation(true, true), "registered")).toBe("conforme");
    expect(dashboardSealFor(obligation(true, false), "registered")).toBe("conforme");
  });

  it("in_progress + obligated → azione_richiesta", () => {
    expect(dashboardSealFor(obligation(true, false), "in_progress")).toBe("azione_richiesta");
    expect(dashboardSealFor(obligation(true, true), "in_progress")).toBe("azione_richiesta");
  });

  it("not_registered foreign obligated → esposto", () => {
    expect(dashboardSealFor(obligation(true, false), "not_registered")).toBe("esposto");
  });

  it("not_registered domestic obligated → azione_richiesta (CAC often upstream)", () => {
    expect(dashboardSealFor(obligation(true, true), "not_registered")).toBe("azione_richiesta");
  });
});

describe("isConfigured", () => {
  it("true once action has started", () => {
    expect(isConfigured("not_registered")).toBe(false);
    expect(isConfigured("in_progress")).toBe(true);
    expect(isConfigured("registered")).toBe(true);
  });
});
