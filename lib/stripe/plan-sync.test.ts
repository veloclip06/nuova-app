import { describe, expect, it } from "vitest";

import { planFromSubscription } from "./plan-sync";

const PRICES = { essenziale: "price_ess", completo: "price_com" };

describe("planFromSubscription", () => {
  it("maps an active subscription to the plan of its price", () => {
    expect(planFromSubscription({ status: "active", priceIds: ["price_ess"] }, PRICES)).toBe(
      "essenziale",
    );
    expect(planFromSubscription({ status: "active", priceIds: ["price_com"] }, PRICES)).toBe(
      "completo",
    );
  });

  it("keeps access during trialing and past_due (dunning grace)", () => {
    expect(planFromSubscription({ status: "trialing", priceIds: ["price_com"] }, PRICES)).toBe(
      "completo",
    );
    expect(planFromSubscription({ status: "past_due", priceIds: ["price_ess"] }, PRICES)).toBe(
      "essenziale",
    );
  });

  it("drops to free on every terminal/inactive status", () => {
    for (const status of ["canceled", "unpaid", "incomplete", "incomplete_expired", "paused"]) {
      expect(planFromSubscription({ status, priceIds: ["price_com"] }, PRICES)).toBe("free");
    }
  });

  it("fails closed to free on an unrecognised price", () => {
    expect(planFromSubscription({ status: "active", priceIds: ["price_other"] }, PRICES)).toBe(
      "free",
    );
    expect(planFromSubscription({ status: "active", priceIds: [] }, PRICES)).toBe("free");
  });

  it("picks the recognised price when multiple items are present", () => {
    expect(
      planFromSubscription({ status: "active", priceIds: ["price_other", "price_com"] }, PRICES),
    ).toBe("completo");
  });
});
