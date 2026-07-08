import { describe, expect, it } from "vitest";
import { loadAllRules } from "@/lib/rules/load";
import { checkObligations } from "@/lib/engine/check-obligations";
import type { CountryObligation } from "@/lib/engine/types";
import { sealStatusFor } from "./seal-status";

const rules = loadAllRules().ok.map(({ rule }) => rule);
const REFERENCE_DATE = "2026-07-07";

function obligationFor(
  establishment: string,
  country: string,
  channels: string[],
): CountryObligation {
  const [obligation] = checkObligations(
    {
      establishmentCountry: establishment,
      sellingCountries: [country],
      channels,
      referenceDate: REFERENCE_DATE,
    },
    rules,
  );
  return obligation;
}

/**
 * Ratified seal semantics (2026-07-07): the seal reflects the legal status,
 * risk claims reflect confirmed enforcement. riskLevel never drives the seal.
 */
describe("sealStatusFor", () => {
  it("foreign obligated country → esposto, even without marketplace channels", () => {
    const de = obligationFor("IT", "DE", ["shopify"]);
    expect(de.riskLevel).toBe("medium"); // no marketplace exposure
    expect(sealStatusFor(de)).toBe("esposto"); // but legally uncovered
  });

  it("foreign obligated country with confirmed marketplace blocking → esposto", () => {
    const de = obligationFor("IT", "DE", ["amazon"]);
    expect(de.riskLevel).toBe("high");
    expect(sealStatusFor(de)).toBe("esposto");
  });

  it("foreign country with uncertain marketplace data stays esposto (sanctions are law)", () => {
    const it_ = obligationFor("DE", "IT", ["amazon"]);
    expect(it_.riskLevel).toBe("medium"); // engine never promotes on uncertain blocking
    expect(sealStatusFor(it_)).toBe("esposto");
  });

  it("domestic country → azione_richiesta, and it wins over riskLevel", () => {
    const de = obligationFor("DE", "DE", ["amazon"]);
    expect(de.domestic).toBe(true);
    expect(de.riskLevel).toBe("high"); // marketplace blocking still applies…
    expect(sealStatusFor(de)).toBe("azione_richiesta"); // …but domestic copy wins
  });

  it("extra-EU establishment is never domestic → esposto", () => {
    const fr = obligationFor("ZZ", "FR", ["shopify"]);
    expect(fr.domestic).toBe(false);
    expect(sealStatusFor(fr)).toBe("esposto");
  });

  it("not obligated → non_obbligato (unreachable from today's rules, guarded for tomorrow's)", () => {
    const de = { ...obligationFor("IT", "DE", ["shopify"]), obligated: false };
    expect(sealStatusFor(de)).toBe("non_obbligato");
  });
});
