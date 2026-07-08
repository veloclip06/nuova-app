import { describe, expect, it } from "vitest";
import { t } from "@/lib/i18n";
import { EU_MEMBER_STATES } from "@/lib/engine/eu-countries";
import {
  ALL_SELLING,
  CHANNEL_IDS,
  ESTABLISHMENT_EU,
  EXTRA_EU,
  INTEREST_SELLING,
  PRIMARY_SELLING,
  PRODUCT_TYPE_IDS,
  VOLUME_BAND_IDS,
  optionKeys,
  toCheckerInput,
  type CheckerAnswers,
} from "./options";

function expectUnique(values: readonly string[]) {
  expect(new Set(values).size).toBe(values.length);
}

/** t() returns the key itself when it is missing from it.json. */
function expectLocalized(key: string) {
  expect(t(key), `missing it.json key: ${key}`).not.toBe(key);
}

describe("checker option taxonomy", () => {
  it("ids are unique within each list", () => {
    expectUnique(ESTABLISHMENT_EU);
    expectUnique(ALL_SELLING);
    expectUnique(CHANNEL_IDS);
    expectUnique(PRODUCT_TYPE_IDS);
    expectUnique(VOLUME_BAND_IDS);
  });

  it("selling countries never overlap between primary and interest-only", () => {
    for (const code of INTEREST_SELLING) {
      expect(PRIMARY_SELLING).not.toContain(code);
    }
  });

  it("establishment options are the 27 EU states, and ZZ is not one of them", () => {
    expect(ESTABLISHMENT_EU).toHaveLength(27);
    expect(new Set(ESTABLISHMENT_EU)).toEqual(new Set(EU_MEMBER_STATES));
    expect(EU_MEMBER_STATES.has(EXTRA_EU)).toBe(false);
  });

  it("every option id resolves to an Italian label in it.json", () => {
    for (const code of ESTABLISHMENT_EU) expectLocalized(optionKeys.country(code));
    expectLocalized(optionKeys.country(EXTRA_EU));
    for (const code of ALL_SELLING) expectLocalized(optionKeys.country(code));
    for (const id of CHANNEL_IDS) expectLocalized(optionKeys.channel(id));
    for (const id of PRODUCT_TYPE_IDS) expectLocalized(optionKeys.productType(id));
    for (const id of VOLUME_BAND_IDS) expectLocalized(optionKeys.volume(id));
  });
});

describe("toCheckerInput", () => {
  it("maps answers onto the engine input with the explicit reference date", () => {
    const answers: CheckerAnswers = {
      establishment: "IT",
      selling: ["DE", "FR"],
      channels: ["amazon", "shopify"],
      productTypes: ["fashion"],
      volumeByCountry: { DE: "b2", FR: "b1" },
    };
    const input = toCheckerInput(answers, "2026-07-07");
    expect(input).toEqual({
      establishmentCountry: "IT",
      sellingCountries: ["DE", "FR"],
      channels: ["amazon", "shopify"],
      productTypes: ["fashion"],
      volumeBandByCountry: { DE: "b2", FR: "b1" },
      referenceDate: "2026-07-07",
    });
    // defensive copies — mutating the input must not touch the answers
    input.sellingCountries.push("IT");
    expect(answers.selling).toEqual(["DE", "FR"]);
  });
});
