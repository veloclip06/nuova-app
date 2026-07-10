import { describe, expect, it } from "vitest";

import { planForPriceId, priceIdForPlan, readPriceEnv } from "./prices";

const PRICES = { essenziale: "price_ess_123", completo: "price_com_456" };

describe("readPriceEnv", () => {
  it("reads the NEXT_PUBLIC_STRIPE_PRICE_* vars from an env object", () => {
    const env = {
      NEXT_PUBLIC_STRIPE_PRICE_ESSENZIALE: "price_a",
      NEXT_PUBLIC_STRIPE_PRICE_COMPLETO: "price_b",
    } as unknown as NodeJS.ProcessEnv;
    expect(readPriceEnv(env)).toEqual({ essenziale: "price_a", completo: "price_b" });
  });

  it("returns undefined fields when vars are missing", () => {
    expect(readPriceEnv({} as unknown as NodeJS.ProcessEnv)).toEqual({
      essenziale: undefined,
      completo: undefined,
    });
  });
});

describe("priceIdForPlan", () => {
  it("maps both paid plans to their price id", () => {
    expect(priceIdForPlan("essenziale", PRICES)).toBe("price_ess_123");
    expect(priceIdForPlan("completo", PRICES)).toBe("price_com_456");
  });

  it("returns null when the env var is missing or empty", () => {
    expect(priceIdForPlan("essenziale", {})).toBeNull();
    expect(priceIdForPlan("completo", { completo: "" })).toBeNull();
  });
});

describe("planForPriceId", () => {
  it("reverse-maps both price ids", () => {
    expect(planForPriceId("price_ess_123", PRICES)).toBe("essenziale");
    expect(planForPriceId("price_com_456", PRICES)).toBe("completo");
  });

  it("returns null for unknown ids or unconfigured env", () => {
    expect(planForPriceId("price_other", PRICES)).toBeNull();
    expect(planForPriceId("price_ess_123", {})).toBeNull();
  });

  it("never matches an empty price id against unset env", () => {
    expect(planForPriceId("", { essenziale: undefined, completo: undefined })).toBeNull();
  });
});
