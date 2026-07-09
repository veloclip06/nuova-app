import { describe, expect, it } from "vitest";
import { EU_MEMBER_STATES } from "@/lib/engine/eu-countries";
import { getCoveredCountries } from "./coverage";
import { listRuleFiles } from "./load";

describe("getCoveredCountries", () => {
  const covered = getCoveredCountries();

  it("derives exactly one covered country per rule file on disk", () => {
    const expected = listRuleFiles()
      .map((f) => f.replace(/\.ya?ml$/, "").toUpperCase())
      .sort();
    expect(covered.map((c) => c.code).sort()).toEqual(expected);
  });

  it("every covered country is an EU member with name and register", () => {
    for (const country of covered) {
      expect(EU_MEMBER_STATES.has(country.code), `${country.code} not EU`).toBe(true);
      expect(country.name).toBeTruthy();
      expect(country.registerName).toBeTruthy();
    }
  });

  it("sorts by Italian country name", () => {
    const names = covered.map((c) => c.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, "it")));
  });
});
