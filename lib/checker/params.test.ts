import { describe, expect, it } from "vitest";
import { decodeAnswers, encodeAnswers, sanitizeAnswers } from "./params";
import type { CheckerAnswers } from "./options";

const answers: CheckerAnswers = {
  establishment: "IT",
  selling: ["DE", "FR", "IT"],
  channels: ["amazon", "shopify"],
  productTypes: ["fashion", "food"],
  volumeByCountry: { DE: "b2", FR: "b1", IT: "unknown" },
};

function asSearchParams(query: string): Record<string, string | string[] | undefined> {
  return Object.fromEntries(new URLSearchParams(query).entries());
}

describe("encodeAnswers / decodeAnswers", () => {
  it("round-trips a full set of answers", () => {
    expect(decodeAnswers(asSearchParams(encodeAnswers(answers)))).toEqual(answers);
  });

  it("round-trips without optional parts", () => {
    const minimal: CheckerAnswers = {
      establishment: "ZZ",
      selling: ["DE"],
      channels: ["other"],
      productTypes: [],
      volumeByCountry: {},
    };
    const query = encodeAnswers(minimal);
    expect(query).not.toContain("p=");
    expect(query).not.toContain("v=");
    expect(decodeAnswers(asSearchParams(query))).toEqual(minimal);
  });

  it("filters unknown tokens instead of failing (shared URLs survive option changes)", () => {
    const decoded = decodeAnswers(
      asSearchParams("e=it&s=de,XX,de,GB&c=AMAZON,fax&p=fashion,junk&v=DE:b2,DE:zz,US:b1"),
    );
    expect(decoded).toEqual({
      establishment: "IT",
      selling: ["DE"],
      channels: ["amazon"],
      productTypes: ["fashion"],
      volumeByCountry: { DE: "b2" },
    });
  });

  it("returns null when structurally invalid", () => {
    expect(decodeAnswers({})).toBeNull();
    expect(decodeAnswers(asSearchParams("s=DE&c=amazon"))).toBeNull(); // no establishment
    expect(decodeAnswers(asSearchParams("e=US&s=DE&c=amazon"))).toBeNull(); // not EU, not ZZ
    expect(decodeAnswers(asSearchParams("e=IT&s=GB&c=amazon"))).toBeNull(); // nothing valid to sell
    expect(decodeAnswers(asSearchParams("e=IT&s=DE&c=fax"))).toBeNull(); // no valid channel
  });
});

describe("sanitizeAnswers", () => {
  it("rejects non-object payloads", () => {
    expect(sanitizeAnswers(null)).toBeNull();
    expect(sanitizeAnswers("e=IT")).toBeNull();
    expect(sanitizeAnswers(42)).toBeNull();
  });

  it("accepts arrays as well as comma-joined strings (JSON lead payloads)", () => {
    expect(
      sanitizeAnswers({
        establishment: "de",
        selling: ["FR", "it"],
        channels: ["ebay"],
        productTypes: [],
        volumeByCountry: { FR: "b3" },
      }),
    ).toEqual({
      establishment: "DE",
      selling: ["FR", "IT"],
      channels: ["ebay"],
      productTypes: [],
      volumeByCountry: { FR: "b3" },
    });
  });

  it("drops volume entries for countries not being sold to", () => {
    const result = sanitizeAnswers({
      establishment: "IT",
      selling: "DE",
      channels: "amazon",
      volumeByCountry: { DE: "b1", FR: "b1" },
    });
    expect(result?.volumeByCountry).toEqual({ DE: "b1" });
  });
});
