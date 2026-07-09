import { describe, expect, it } from "vitest";
import { listRuleFiles, loadAllRules } from "@/lib/rules/load";
import type { CountryRule } from "@/lib/rules/schema";
import { checkObligations } from "./check-obligations";
import type { CheckerInput } from "./types";

// The engine must work on the real rule files — tests load them from /rules
// (the I/O lives here in the test; the engine itself stays pure).
const loaded = loadAllRules();
const rules: CountryRule[] = loaded.ok.map(({ rule }) => rule);

const REFERENCE_DATE = "2026-07-07";

function input(overrides: Partial<CheckerInput>): CheckerInput {
  return {
    establishmentCountry: "IT",
    sellingCountries: ["DE"],
    channels: ["amazon"],
    referenceDate: REFERENCE_DATE,
    ...overrides,
  };
}

describe("rule files", () => {
  it("all /rules YAML files load and validate", () => {
    expect(loaded.errors).toEqual([]);
    // Coverage is data: the loaded set must match the files on disk (one
    // country per file, filename = lowercase country code) — never a constant.
    const expected = listRuleFiles()
      .map((f) => f.replace(/\.ya?ml$/, "").toUpperCase())
      .sort();
    expect(rules.map((r) => r.country_code).sort()).toEqual(expected);
    expect(rules.length).toBeGreaterThan(0);
  });
});

describe("checkObligations — IT company selling only in DE", () => {
  const result = checkObligations(input({}), rules);

  it("returns exactly one obligation, for DE", () => {
    expect(result).toHaveLength(1);
    expect(result[0].countryCode).toBe("DE");
    expect(result[0].countryName).toBe("Germania");
  });

  it("is obligated, non-domestic, with the LUCID register", () => {
    const de = result[0];
    expect(de.obligated).toBe(true);
    expect(de.domestic).toBe(false);
    expect(de.register.name).toBe("LUCID");
    expect(de.register.costRegistration).toBe(0);
    expect(de.register.uncertain).toBeUndefined(); // cost is sourced (free)
  });

  it("lists the sourced requirements", () => {
    const ids = result[0].requirements.map((r) => r.id);
    expect(ids).toContain("register_lucid");
    expect(ids).toContain("system_participation");
  });

  it("resolves the AR as the EU-seller case: uncertain, with both temporal values", () => {
    const ar = result[0].authorisedRepresentative;
    expect(ar).not.toBeNull();
    expect(ar!.sellerType).toBe("eu");
    expect(ar!.status).toBe("uncertain");
    expect(ar!.uncertain).toBe(true);
    // The two dates from the 2026-07-09 verification: optional until 11 Aug
    // 2026, then mandatory unless the Omnibus is adopted in time.
    expect(ar!.valueUntil20260811).toBe("optional");
    expect(ar!.valueFrom20260812).toBe("mandatory_unless_omnibus_adopted");
  });

  it("always carries the official sources and the draft status", () => {
    const de = result[0];
    expect(de.sources.length).toBeGreaterThan(0);
    expect(de.sources.every((s) => s.url.startsWith("http"))).toBe(true);
    expect(de.rulesStatus).toBe("draft");
    expect(de.lastVerifiedByHuman).toBeNull();
    expect(de.uncertain).toBe(true); // draft rules are never presented as settled
  });

  it("computes the next deadline from the YAML schedules (never invented)", () => {
    const next = result[0].nextDeadline;
    expect(next).not.toBeNull();
    // From 2026-07-07 the first dated DE deadline is the planned-volume
    // report for 2027, due 31 Dec 2026.
    expect(next!.dueDate).toBe("2026-12-31");
    expect(next!.sourceKind).toBe("initial_planned_volume_report");
  });
});

describe("checkObligations — IT company selling in DE+FR+IT (marketplace channels)", () => {
  const result = checkObligations(
    input({ sellingCountries: ["DE", "FR", "IT"], channels: ["amazon", "shopify"] }),
    rules,
  );
  const de = result.find((o) => o.countryCode === "DE")!;
  const fr = result.find((o) => o.countryCode === "FR")!;
  const it_ = result.find((o) => o.countryCode === "IT")!;

  it("returns all three covered countries, all obligated", () => {
    expect(result).toHaveLength(3);
    expect(result.every((o) => o.obligated)).toBe(true);
  });

  it("marks only the home country as domestic", () => {
    expect(it_.domestic).toBe(true);
    expect(de.domestic).toBe(false);
    expect(fr.domestic).toBe(false);
  });

  it("includes non-established-only requirements abroad, not at home", () => {
    expect(fr.requirements.map((r) => r.id)).toContain("appoint_mandataire");
    expect(it_.requirements.map((r) => r.id)).not.toContain("foreign_domicile");
  });

  it("omits the authorised-representative question for the domestic country", () => {
    expect(it_.authorisedRepresentative).toBeNull();
    expect(de.authorisedRepresentative).not.toBeNull();
    expect(fr.authorisedRepresentative).not.toBeNull();
  });

  it("FR EU seller: national mandataire obligation stands, Omnibus effect uncertain", () => {
    const ar = fr.authorisedRepresentative!;
    expect(ar.sellerType).toBe("eu");
    expect(ar.status).toBe("confirmed_national");
    expect(ar.value).toBe("mandatory");
    expect(ar.uncertain).toBe(true); // omnibus_effect: uncertain → badge
  });

  it("promotes risk to high only where marketplaces block listings (DE, FR)", () => {
    expect(de.riskLevel).toBe("high");
    expect(fr.riskLevel).toBe("high");
    expect(it_.riskLevel).toBe("medium"); // IT blocking is TODO-VERIFY, never presented as settled
  });

  it("propagates the IT marketplace uncertainty as an uncertain risk factor", () => {
    const marketplaceFactor = it_.riskFactors.find((f) => f.text.includes("Pay on Behalf"));
    expect(marketplaceFactor).toBeDefined();
    expect(marketplaceFactor!.uncertain).toBe(true);
  });

  it("propagates the FR register-cost TODO-VERIFY", () => {
    expect(fr.register.costRegistration).toBeNull();
    expect(fr.register.uncertain).toBe(true);
    expect(fr.uncertain).toBe(true);
  });

  it("propagates penalties uncertainty (FR Triman amount, IT art. 261 conflict)", () => {
    expect(fr.penalties.uncertain).toBe(true);
    expect(it_.penalties.uncertain).toBe(true);
  });
});

describe("checkObligations — channels gate marketplace risk, not the obligation", () => {
  const withMarketplace = checkObligations(input({ channels: ["amazon"] }), rules)[0];
  const ownShopOnly = checkObligations(input({ channels: ["shopify"] }), rules)[0];

  it("the legal obligation and requirements are identical regardless of channels", () => {
    expect(ownShopOnly.obligated).toBe(true);
    expect(ownShopOnly.requirements.map((r) => r.id)).toEqual(
      withMarketplace.requirements.map((r) => r.id),
    );
  });

  it("selling only via own shop: no marketplace risk factor, risk not promoted", () => {
    expect(ownShopOnly.riskLevel).toBe("medium");
    expect(ownShopOnly.riskFactors.some((f) => f.text.includes("Amazon"))).toBe(false);
  });

  it("selling on a marketplace where blocking is enforced: high risk with the factor", () => {
    expect(withMarketplace.riskLevel).toBe("high");
    expect(withMarketplace.riskFactors.some((f) => f.text.includes("Amazon"))).toBe(true);
  });
});

describe("checkObligations — extra-EU company selling in DE+FR+IT", () => {
  const result = checkObligations(
    input({ establishmentCountry: "GB", sellingCountries: ["DE", "FR", "IT"] }),
    rules,
  );

  it("no country is domestic; the AR obligation is CONFIRMED everywhere, no badge", () => {
    expect(result).toHaveLength(3);
    for (const obligation of result) {
      expect(obligation.domestic).toBe(false);
      const ar = obligation.authorisedRepresentative;
      expect(ar).not.toBeNull();
      // The Omnibus suspension explicitly excludes third-country producers.
      expect(ar!.sellerType).toBe("non_eu");
      expect(ar!.status).toBe("confirmed");
      expect(ar!.value).toBe("mandatory");
      expect(ar!.uncertain).toBe(false);
      // The rule files themselves are still drafts, so the country stays uncertain.
      expect(obligation.uncertain).toBe(true);
    }
  });

  it("includes the non-established requirements everywhere they exist", () => {
    const fr = result.find((o) => o.countryCode === "FR")!;
    const it_ = result.find((o) => o.countryCode === "IT")!;
    expect(fr.requirements.map((r) => r.id)).toContain("appoint_mandataire");
    expect(it_.requirements.map((r) => r.id)).toContain("foreign_domicile");
  });

  it("IT next deadline is undated (no CAC data at checker time) — never invented", () => {
    const it_ = result.find((o) => o.countryCode === "IT")!;
    expect(it_.nextDeadline).not.toBeNull();
    expect(it_.nextDeadline!.dueDate).toBeNull();
    expect(it_.nextDeadline!.kind).toBe("registration");
  });
});

describe("checkObligations — input handling", () => {
  it("ignores countries without a rule file (caller's concern)", () => {
    const result = checkObligations(input({ sellingCountries: ["ES", "DE", "PL"] }), rules);
    expect(result.map((o) => o.countryCode)).toEqual(["DE"]);
  });

  it("deduplicates selling countries and normalises case", () => {
    const result = checkObligations(input({ sellingCountries: ["de", "DE"] }), rules);
    expect(result).toHaveLength(1);
  });

  it("rejects a malformed reference date", () => {
    expect(() => checkObligations(input({ referenceDate: "07/07/2026" }), rules)).toThrow(
      TypeError,
    );
  });
});
