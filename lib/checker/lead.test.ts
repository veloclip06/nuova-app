import { describe, expect, it } from "vitest";
import { loadAllRules } from "@/lib/rules/load";
import { buildLead, leadPayloadSchema } from "./lead";

const rules = loadAllRules().ok.map(({ rule }) => rule);
const REFERENCE_DATE = "2026-07-07";

const validPayload = {
  email: "  Nome@Azienda.IT ",
  answers: {
    establishment: "IT",
    selling: ["DE", "FR", "ES"], // ES has no rule file — interest only
    channels: ["amazon"],
    productTypes: ["fashion"],
    volumeByCountry: { DE: "b2" },
  },
};

describe("leadPayloadSchema", () => {
  it("normalises the email and sanitises the answers", () => {
    const parsed = leadPayloadSchema.parse(validPayload);
    expect(parsed.email).toBe("nome@azienda.it");
    expect(parsed.answers.selling).toEqual(["DE", "FR", "ES"]);
  });

  it("rejects an invalid email", () => {
    expect(leadPayloadSchema.safeParse({ ...validPayload, email: "niente" }).success).toBe(false);
  });

  it("rejects structurally invalid answers", () => {
    expect(
      leadPayloadSchema.safeParse({ email: "a@b.it", answers: { establishment: "US" } }).success,
    ).toBe(false);
    expect(leadPayloadSchema.safeParse({ email: "a@b.it", answers: null }).success).toBe(false);
  });
});

describe("buildLead", () => {
  const lead = buildLead(leadPayloadSchema.parse(validPayload), rules, REFERENCE_DATE);

  it("stores the exact engine input as answers, referenceDate included", () => {
    expect(lead.answers.establishmentCountry).toBe("IT");
    expect(lead.answers.referenceDate).toBe(REFERENCE_DATE);
    expect(lead.answers.volumeBandByCountry).toEqual({ DE: "b2" });
  });

  it("recomputes the result server-side: covered countries only, from the real rules", () => {
    expect(lead.result.map((o) => o.countryCode)).toEqual(["DE", "FR"]);
    expect(lead.result.every((o) => o.sources.length > 0)).toBe(true);
  });
});
