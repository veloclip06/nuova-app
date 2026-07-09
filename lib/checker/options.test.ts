import { describe, expect, it } from "vitest";
import { t } from "@/lib/i18n";
import { EU_MEMBER_STATES } from "@/lib/engine/eu-countries";
import { FLAG_GRADIENTS } from "./flags";
import {
  CHANNEL_IDS,
  EU_COUNTRIES,
  EXTRA_EU,
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
    expectUnique(EU_COUNTRIES);
    expectUnique(CHANNEL_IDS);
    expectUnique(PRODUCT_TYPE_IDS);
    expectUnique(VOLUME_BAND_IDS);
  });

  it("country options are the 27 EU states, and ZZ is not one of them", () => {
    expect(EU_COUNTRIES).toHaveLength(27);
    expect(new Set(EU_COUNTRIES)).toEqual(new Set(EU_MEMBER_STATES));
    expect(EU_MEMBER_STATES.has(EXTRA_EU)).toBe(false);
  });

  it("every option id resolves to an Italian label in it.json", () => {
    for (const code of EU_COUNTRIES) expectLocalized(optionKeys.country(code));
    expectLocalized(optionKeys.country(EXTRA_EU));
    for (const id of CHANNEL_IDS) expectLocalized(optionKeys.channel(id));
    for (const id of PRODUCT_TYPE_IDS) expectLocalized(optionKeys.productType(id));
    for (const id of VOLUME_BAND_IDS) expectLocalized(optionKeys.volume(id));
  });

  // NUOVO_PAESE.md checklist: no country may ever need a code change for its
  // flag — every EU member state has a CSS swatch (ZZ falls back to neutral).
  it("every EU member state has a flag gradient", () => {
    for (const code of EU_COUNTRIES) {
      expect(FLAG_GRADIENTS[code], `missing flag gradient: ${code}`).toBeTruthy();
    }
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
