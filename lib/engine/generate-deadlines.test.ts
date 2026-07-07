import { describe, expect, it } from "vitest";
import { loadAllRules } from "@/lib/rules/load";
import type { CanonicalMaterial, CountryRule } from "@/lib/rules/schema";
import { generateDeadlines, resolveSchedule } from "./generate-deadlines";
import type { CompanyProfile, EngineDeadline } from "./types";

const rules: CountryRule[] = loadAllRules().ok.map(({ rule }) => rule);

function company(overrides: Partial<CompanyProfile>): CompanyProfile {
  return { establishmentCountry: "IT", countries: [], ...overrides };
}

function bySource(deadlines: EngineDeadline[], sourceKind: string): EngineDeadline[] {
  return deadlines.filter((d) => d.sourceKind === sourceKind);
}

describe("resolveSchedule — date arithmetic", () => {
  it("clamps day_of_month to the length of the month (31 → 28 in Feb)", () => {
    const occurrences = resolveSchedule(
      { period: "month", months_after_period_end: 0, day_of_month: 31 },
      { referenceDate: "2026-02-01", horizonMonths: 1 },
    );
    expect(occurrences).toEqual([{ periodLabel: "2026-02", dueDate: "2026-02-28" }]);
  });

  it("clamps to 29 February in a leap year", () => {
    const occurrences = resolveSchedule(
      { period: "month", months_after_period_end: 0, day_of_month: 31 },
      { referenceDate: "2028-02-01", horizonMonths: 1 },
    );
    expect(occurrences).toEqual([{ periodLabel: "2028-02", dueDate: "2028-02-29" }]);
  });

  it("supports negative offsets (due before the period starts)", () => {
    // DE planned-volume report for year Y is due 31 Dec of Y-1.
    const occurrences = resolveSchedule(
      { period: "year", months_after_period_end: -12, day_of_month: 31 },
      { referenceDate: "2026-07-07", horizonMonths: 12 },
    );
    expect(occurrences).toEqual([{ periodLabel: "2027", dueDate: "2026-12-31" }]);
  });

  it("rejects a malformed reference date", () => {
    expect(() =>
      resolveSchedule(
        { period: "year", months_after_period_end: 5, day_of_month: 15 },
        { referenceDate: "2026-13-01" },
      ),
    ).toThrow(TypeError);
  });
});

describe("generateDeadlines — year-boundary window (Nov 2026 → Nov 2027)", () => {
  const window = { referenceDate: "2026-11-01", horizonMonths: 12 };
  const profile = company({
    countries: [
      { countryCode: "DE", status: "registered" },
      { countryCode: "FR", status: "registered" },
      {
        countryCode: "IT",
        status: "registered",
        priorYearCacEurByMaterial: { paper_cardboard: 2000 },
      },
    ],
  });
  const deadlines = generateDeadlines(profile, rules, window);

  it("DE year-end report for 2026 lands on 15 May 2027", () => {
    expect(bySource(deadlines, "year_end_report")).toEqual([
      expect.objectContaining({ dueDate: "2027-05-15", periodLabel: "2026", kind: "report" }),
    ]);
  });

  it("DE planned-volume report for 2027 lands on 31 Dec 2026", () => {
    expect(bySource(deadlines, "initial_planned_volume_report")).toEqual([
      expect.objectContaining({ dueDate: "2026-12-31", periodLabel: "2027" }),
    ]);
  });

  it("DE Vollständigkeitserklärung is emitted as conditional, never dropped", () => {
    const [ve] = bySource(deadlines, "declaration_of_completeness");
    expect(ve).toBeDefined();
    expect(ve.dueDate).toBe("2027-05-15");
    expect(ve.conditional).toBe(true);
    expect(ve.conditionNote).toContain("completeness_thresholds");
  });

  it("FR annual declaration for 2026 closes on 28 Feb 2027", () => {
    expect(bySource(deadlines, "annual_declaration")).toEqual([
      expect.objectContaining({ dueDate: "2027-02-28", periodLabel: "2026" }),
    ]);
  });

  it("FR payment has no machine-readable date → informational, never invented", () => {
    const [payment] = bySource(deadlines, "payment");
    expect(payment).toBeDefined();
    expect(payment.kind).toBe("payment");
    expect(payment.dueDate).toBeNull();
    expect(payment.ruleText.length).toBeGreaterThan(0);
  });

  it("IT annual CAC declaration for 2026 lands on 20 Jan 2027", () => {
    expect(bySource(deadlines, "annual")).toEqual([
      expect.objectContaining({
        dueDate: "2027-01-20",
        periodLabel: "2026",
        materials: ["paper_cardboard"],
      }),
    ]);
  });

  it("dated deadlines come first, sorted ascending", () => {
    const dated = deadlines.filter((d) => d.dueDate !== null).map((d) => d.dueDate!);
    expect(dated).toEqual([...dated].sort());
    const firstUndated = deadlines.findIndex((d) => d.dueDate === null);
    expect(deadlines.slice(firstUndated).every((d) => d.dueDate === null)).toBe(true);
  });
});

describe("generateDeadlines — CONAI variable periodicity by prior-year CAC", () => {
  const window = { referenceDate: "2026-01-01", horizonMonths: 12 };

  function italyWith(
    cac: Partial<Record<CanonicalMaterial, number>> | undefined,
  ): EngineDeadline[] {
    return generateDeadlines(
      company({
        countries: [
          { countryCode: "IT", status: "registered", priorYearCacEurByMaterial: cac },
        ],
      }),
      rules,
      window,
    );
  }

  it("CAC ≤ 3.000 €/material → annual declaration (20 Jan)", () => {
    const annual = bySource(italyWith({ plastic: 2000 }), "annual");
    expect(annual).toHaveLength(1);
    expect(annual[0].dueDate).toBe("2026-01-20");
    expect(annual[0].periodLabel).toBe("2025");
    expect(annual[0].materials).toEqual(["plastic"]);
  });

  it("CAC exactly 3.000 € stays annual (threshold is inclusive)", () => {
    const deadlines = italyWith({ plastic: 3000 });
    expect(bySource(deadlines, "annual")).toHaveLength(1);
    expect(bySource(deadlines, "quarterly")).toHaveLength(0);
  });

  it("3.000 < CAC ≤ 31.000 → quarterly, due the 20th of the month after each quarter", () => {
    const quarterly = bySource(italyWith({ plastic: 10000 }), "quarterly");
    expect(quarterly.map((d) => d.dueDate)).toEqual([
      "2026-01-20", // Q4 2025 — year boundary handled by the same arithmetic
      "2026-04-20",
      "2026-07-20",
      "2026-10-20",
    ]);
    expect(quarterly.map((d) => d.periodLabel)).toEqual([
      "2025-Q4",
      "2026-Q1",
      "2026-Q2",
      "2026-Q3",
    ]);
  });

  it("CAC > 31.000 → monthly, due the 20th of the following month (12 in a year)", () => {
    const monthly = bySource(italyWith({ plastic: 50000 }), "monthly");
    expect(monthly).toHaveLength(12);
    expect(monthly[0]).toMatchObject({ dueDate: "2026-01-20", periodLabel: "2025-12" });
    expect(monthly[11]).toMatchObject({ dueDate: "2026-12-20", periodLabel: "2026-11" });
  });

  it("materials in different tiers get separate deadlines with their own materials", () => {
    const deadlines = italyWith({ paper_cardboard: 2000, plastic: 10000, glass: 50000 });
    expect(bySource(deadlines, "annual")[0].materials).toEqual(["paper_cardboard"]);
    expect(bySource(deadlines, "quarterly")[0].materials).toEqual(["plastic"]);
    expect(bySource(deadlines, "monthly")[0].materials).toEqual(["glass"]);
  });

  it("missing CAC data → one explicitly uncertain deadline, tier never guessed", () => {
    const deadlines = italyWith(undefined).filter((d) => d.kind === "report");
    expect(deadlines).toHaveLength(1);
    expect(deadlines[0].dueDate).toBeNull();
    expect(deadlines[0].uncertain).toBe(true);
    expect(deadlines[0].sourceKind).toBe("annual|quarterly|monthly");
    expect(deadlines[0].uncertaintyNote).toContain("priorYearCacEurByMaterial");
  });
});

describe("generateDeadlines — registration deadlines", () => {
  const window = { referenceDate: "2026-07-07", horizonMonths: 12 };

  it("emits undated registration obligations while not registered", () => {
    const deadlines = generateDeadlines(
      company({ countries: [{ countryCode: "DE", status: "not_registered" }] }),
      rules,
      window,
    );
    const registration = deadlines.filter((d) => d.kind === "registration");
    const ids = registration.map((d) => d.sourceKind);
    expect(ids).toContain("register_lucid");
    expect(ids).toContain("system_participation");
    // Fulfilled through reporting.deadlines — must not be duplicated here.
    expect(ids).not.toContain("volume_report");
    expect(registration.every((d) => d.dueDate === null)).toBe(true);
  });

  it("drops registration items once registered", () => {
    const deadlines = generateDeadlines(
      company({ countries: [{ countryCode: "DE", status: "registered" }] }),
      rules,
      window,
    );
    expect(deadlines.filter((d) => d.kind === "registration")).toHaveLength(0);
  });

  it("includes non-established-only items abroad only (IT foreign domicile)", () => {
    const domestic = generateDeadlines(
      company({
        establishmentCountry: "IT",
        countries: [{ countryCode: "IT", status: "not_registered" }],
      }),
      rules,
      window,
    );
    const foreign = generateDeadlines(
      company({
        establishmentCountry: "US",
        countries: [{ countryCode: "IT", status: "not_registered" }],
      }),
      rules,
      window,
    );
    expect(domestic.map((d) => d.sourceKind)).not.toContain("foreign_domicile");
    expect(foreign.map((d) => d.sourceKind)).toContain("foreign_domicile");
  });

  it("ignores countries without a rule file", () => {
    const deadlines = generateDeadlines(
      company({ countries: [{ countryCode: "ES", status: "not_registered" }] }),
      rules,
      window,
    );
    expect(deadlines).toHaveLength(0);
  });
});
