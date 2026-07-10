import { describe, expect, it } from "vitest";

import {
  PLAN_IDS,
  canAccessReports,
  canAddCoveredCountry,
  canImportCsv,
  canReceiveReminders,
  canSeeReportHistory,
  isPaidPlan,
  maxCoveredCountries,
  normalizePlan,
} from "./plans";

describe("normalizePlan", () => {
  it("passes valid plan ids through", () => {
    for (const plan of PLAN_IDS) {
      expect(normalizePlan(plan)).toBe(plan);
    }
  });

  it("maps legacy placeholder values to the renamed plans", () => {
    expect(normalizePlan("starter")).toBe("essenziale");
    expect(normalizePlan("pro")).toBe("completo");
  });

  it("fails closed to free on unknown, empty or missing values", () => {
    expect(normalizePlan(null)).toBe("free");
    expect(normalizePlan(undefined)).toBe("free");
    expect(normalizePlan("")).toBe("free");
    expect(normalizePlan("enterprise")).toBe("free");
    // Case-sensitive on purpose: the DB check constraint only allows lowercase.
    expect(normalizePlan("FREE")).toBe("free");
    expect(normalizePlan("Completo")).toBe("free");
  });
});

describe("isPaidPlan / canReceiveReminders", () => {
  it("free is not paid and gets no reminders", () => {
    expect(isPaidPlan("free")).toBe(false);
    expect(canReceiveReminders("free")).toBe(false);
  });

  it("both paid plans are paid and get reminders", () => {
    expect(isPaidPlan("essenziale")).toBe(true);
    expect(isPaidPlan("completo")).toBe(true);
    expect(canReceiveReminders("essenziale")).toBe(true);
    expect(canReceiveReminders("completo")).toBe(true);
  });
});

describe("canAccessReports", () => {
  it("blocks free, allows both paid plans", () => {
    expect(canAccessReports("free")).toBe(false);
    expect(canAccessReports("essenziale")).toBe(true);
    expect(canAccessReports("completo")).toBe(true);
  });
});

describe("canImportCsv / canSeeReportHistory", () => {
  it("are completo-only", () => {
    expect(canImportCsv("free")).toBe(false);
    expect(canImportCsv("essenziale")).toBe(false);
    expect(canImportCsv("completo")).toBe(true);
    expect(canSeeReportHistory("free")).toBe(false);
    expect(canSeeReportHistory("essenziale")).toBe(false);
    expect(canSeeReportHistory("completo")).toBe(true);
  });
});

describe("maxCoveredCountries / canAddCoveredCountry", () => {
  it("caps free and essenziale at 3 covered countries", () => {
    expect(maxCoveredCountries("free")).toBe(3);
    expect(maxCoveredCountries("essenziale")).toBe(3);
  });

  it("leaves completo unlimited", () => {
    expect(maxCoveredCountries("completo")).toBeNull();
    expect(canAddCoveredCountry("completo", 27)).toBe(true);
  });

  it("blocks the 4th covered country on capped plans", () => {
    expect(canAddCoveredCountry("free", 2)).toBe(true);
    expect(canAddCoveredCountry("free", 3)).toBe(false);
    expect(canAddCoveredCountry("essenziale", 2)).toBe(true);
    expect(canAddCoveredCountry("essenziale", 3)).toBe(false);
  });
});
