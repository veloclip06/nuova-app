import { describe, expect, it } from "vitest";
import { loadAllRules } from "@/lib/rules/load";
import type { CountryRule } from "@/lib/rules/schema";
import { computeReport } from "./compute-report";
import type { ReportError, ReportInput, SkuInput, VolumeInput } from "./types";

const rules: CountryRule[] = loadAllRules().ok.map(({ rule }) => rule);
const ruleFor = (code: string): CountryRule =>
  rules.find((r) => r.country_code === code)!;

function report(
  countryCode: string,
  skus: SkuInput[],
  volumes: VolumeInput[],
  period = "2026",
): ReturnType<typeof computeReport> {
  const input: ReportInput = { rule: ruleFor(countryCode), period, skus, volumes };
  return computeReport(input);
}

const CATALOGUE: SkuInput[] = [
  {
    skuCode: "BOX-1",
    components: [
      { material: "paper_cardboard", weightGrams: 100 },
      { material: "plastic", weightGrams: 20 },
    ],
  },
  {
    skuCode: "CRATE-1",
    components: [
      { material: "wood", weightGrams: 40 },
      { material: "other", weightGrams: 10 },
    ],
  },
];

const VOLUMES: VolumeInput[] = [
  { skuCode: "BOX-1", units: 100 },
  { skuCode: "CRATE-1", units: 10 },
];

describe("computeReport — canonical → local taxonomy conversion", () => {
  it("DE (LUCID): canonical rows keep their identity, wood+other merge into Sonstiges Material 80000", () => {
    const result = report("DE", CATALOGUE, VOLUMES);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const rows = result.report.rows;
    expect(rows.map((r) => r.canonical)).toEqual([
      "paper_cardboard",
      "plastic",
      "wood",
      "other",
    ]);

    const paper = rows.find((r) => r.canonical === "paper_cardboard")!;
    expect(paper.localName).toBe("Papier, Pappe, Karton (PPK)");
    expect(paper.localCode).toBe("20000");
    expect(paper.totalWeightKg).toBe(10); // 100 g × 100 units = 10.000 kg
    expect(paper.units).toBe(100);

    // Canonical view stays split (§5: users see canonical materials)…
    expect(rows.find((r) => r.canonical === "wood")!.totalWeightKg).toBe(0.4);
    expect(rows.find((r) => r.canonical === "other")!.totalWeightKg).toBe(0.1);

    // …while the portal view aggregates by local category.
    const sonstiges = result.report.byLocalCategory.find((c) => c.localCode === "80000")!;
    expect(sonstiges.localName).toBe("Sonstiges Material");
    expect(sonstiges.totalWeightKg).toBe(0.5); // wood 0.400 + other 0.100
    const codes = result.report.byLocalCategory.map((c) => c.localCode);
    expect(codes.filter((c) => c === "80000")).toHaveLength(1);
  });

  it("FR (Citeo): the wood mapping is TODO-VERIFY and propagates as uncertain", () => {
    const result = report("FR", CATALOGUE, VOLUMES);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const wood = result.report.rows.find((r) => r.canonical === "wood")!;
    expect(wood.localName).toBe("Autres matériaux : bois, liège, textile");
    expect(wood.uncertain).toBe(true);
    expect(wood.uncertaintyNote).toContain("bois non transformé");
    expect(result.report.uncertain).toBe(true); // never presented as settled

    const paper = result.report.rows.find((r) => r.canonical === "paper_cardboard")!;
    expect(paper.uncertain).toBeUndefined();
  });

  it("IT (CONAI): materials map to the consortium categories", () => {
    const result = report("IT", CATALOGUE, VOLUMES);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const rows = result.report.rows;
    expect(rows.find((r) => r.canonical === "paper_cardboard")!.localName).toBe("Carta");
    expect(rows.find((r) => r.canonical === "wood")!.localName).toBe("Legno");
    expect(rows.find((r) => r.canonical === "other")!.localName).toContain("Bioplastica");
  });

  it("rounds to 3 decimals (kg) — LUCID declares kilograms with three decimals", () => {
    const result = report(
      "DE",
      [{ skuCode: "S", components: [{ material: "plastic", weightGrams: 33.33 }] }],
      [{ skuCode: "S", units: 3 }],
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // 33.33 × 3 = 99.99 g → 0.100 kg
    expect(result.report.rows[0].totalWeightKg).toBe(0.1);
  });

  it("report carries the draft status of the rule file", () => {
    const result = report("DE", CATALOGUE, VOLUMES);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.report.rulesStatus).toBe("draft");
    expect(result.report.uncertain).toBe(true);
  });
});

describe("computeReport — actionable errors instead of wrong reports", () => {
  const codesOf = (errors: ReportError[]) => errors.map((e) => e.code);

  it("a sold SKU without packaging components fails with the SKU named", () => {
    const result = report(
      "DE",
      [{ skuCode: "NAKED-1", components: [] }],
      [{ skuCode: "NAKED-1", units: 5 }],
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].code).toBe("MISSING_PACKAGING_COMPONENTS");
    expect(result.errors[0].skuCode).toBe("NAKED-1");
    expect(result.errors[0].message).toContain("NAKED-1");
  });

  it("a component without a weight fails — never a silently wrong total", () => {
    const result = report(
      "DE",
      [
        {
          skuCode: "HALF-1",
          components: [
            { material: "plastic", weightGrams: 12 },
            { material: "glass", weightGrams: null },
          ],
        },
      ],
      [{ skuCode: "HALF-1", units: 5 }],
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0]).toMatchObject({
      code: "MISSING_COMPONENT_WEIGHT",
      skuCode: "HALF-1",
    });
  });

  it("collects EVERY defective SKU in one pass (no fix-one-rerun loop)", () => {
    const result = report(
      "DE",
      [
        { skuCode: "OK-1", components: [{ material: "plastic", weightGrams: 10 }] },
        { skuCode: "BAD-1", components: [] },
        { skuCode: "BAD-2", components: [{ material: "wood", weightGrams: null }] },
      ],
      [
        { skuCode: "OK-1", units: 1 },
        { skuCode: "BAD-1", units: 1 },
        { skuCode: "BAD-2", units: 1 },
        { skuCode: "GHOST-1", units: 1 },
      ],
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(codesOf(result.errors).sort()).toEqual([
      "MISSING_COMPONENT_WEIGHT",
      "MISSING_PACKAGING_COMPONENTS",
      "UNKNOWN_SKU_IN_VOLUMES",
    ]);
  });

  it("an unsold SKU with missing data does not block the report", () => {
    const result = report(
      "DE",
      [
        { skuCode: "SOLD-1", components: [{ material: "plastic", weightGrams: 10 }] },
        { skuCode: "DRAFT-SKU", components: [] }, // in catalogue, not sold
      ],
      [{ skuCode: "SOLD-1", units: 2 }],
    );
    expect(result.ok).toBe(true);
  });

  it("rejects negative or non-integer units", () => {
    const result = report(
      "DE",
      [{ skuCode: "S", components: [{ material: "plastic", weightGrams: 10 }] }],
      [{ skuCode: "S", units: -1 }],
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0].code).toBe("INVALID_UNITS");
  });

  it("validates the period against the country's period format", () => {
    const de = report("DE", CATALOGUE, VOLUMES, "2026-Q3");
    expect(de.ok).toBe(false);
    if (!de.ok) {
      expect(de.errors[0].code).toBe("INVALID_PERIOD");
    }
    // IT's periodicity is variable: year, quarter and month are all valid.
    expect(report("IT", CATALOGUE, VOLUMES, "2026-Q3").ok).toBe(true);
    expect(report("IT", CATALOGUE, VOLUMES, "2026-11").ok).toBe(true);
    expect(report("IT", CATALOGUE, VOLUMES, "Q3-2026").ok).toBe(false);
  });

  it("duplicate volume rows for the same SKU are summed, not dropped", () => {
    const result = report(
      "DE",
      [{ skuCode: "S", components: [{ material: "plastic", weightGrams: 10 }] }],
      [
        { skuCode: "S", units: 2 },
        { skuCode: "S", units: 3 },
      ],
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.report.rows[0].totalWeightKg).toBe(0.05); // 10 g × 5
    expect(result.report.rows[0].units).toBe(5);
  });
});
