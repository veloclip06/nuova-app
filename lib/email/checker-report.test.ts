import { describe, expect, it } from "vitest";
import { loadAllRules } from "@/lib/rules/load";
import { checkObligations } from "@/lib/engine/check-obligations";
import { t } from "@/lib/i18n";
import { buildCheckerReportEmail } from "./checker-report";

const rules = loadAllRules().ok.map(({ rule }) => rule);
const REFERENCE_DATE = "2026-07-07";

// IT company selling everywhere, on a marketplace — the fullest report.
const obligations = checkObligations(
  {
    establishmentCountry: "IT",
    sellingCountries: ["DE", "FR", "IT"],
    channels: ["amazon", "shopify"],
    referenceDate: REFERENCE_DATE,
  },
  rules,
);

const email = buildCheckerReportEmail(obligations, ["Spagna"], REFERENCE_DATE);

describe("buildCheckerReportEmail", () => {
  it("has a subject naming the countries", () => {
    expect(email.subject).toContain("Germania");
    expect(email.subject).not.toContain("{{");
  });

  it("carries every register and its official portal from the rules", () => {
    expect(email.html).toContain("LUCID");
    expect(email.html).toContain("lucid.verpackungsregister.org");
    expect(email.html).toContain("dichiarazioni.conai.org");
    expect(email.text).toContain("LUCID");
  });

  it("marks uncertain data 'in verifica' and never claims human verification on drafts", () => {
    expect(email.html).toContain(t("check.result.inVerifica"));
    // all rules are drafts (lastVerifiedByHuman: null) — "verificato il" is a false claim
    expect(email.html).not.toContain(t("common.verifiedOn"));
    expect(email.html).toContain(t("check.result.draftNotice"));
  });

  it("shows the consultation date of the sources", () => {
    expect(email.html).toContain(t("check.result.sourceAccessed"));
  });

  it("uses the domestic copy for the establishment country", () => {
    expect(email.html).toContain(t("check.result.domestic.IT"));
  });

  it("mentions not-covered countries and closes with the legal disclaimer", () => {
    expect(email.html).toContain("Spagna");
    expect(email.html).toContain(t("common.legalDisclaimer"));
    expect(email.text).toContain(t("common.legalDisclaimer"));
  });

  it("declares the not-yet-registered assumption and leaves no unresolved placeholder", () => {
    expect(email.html).toContain(t("check.result.assumptionNote"));
    expect(email.html).not.toContain("{{");
    expect(email.text).not.toContain("{{");
  });
});
