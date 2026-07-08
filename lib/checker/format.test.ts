import { describe, expect, it } from "vitest";
import { formatDateIt, segmentFigures, todayInRome } from "./format";

describe("formatDateIt", () => {
  it("formats ISO dates as dd/mm/yyyy", () => {
    expect(formatDateIt("2026-07-06")).toBe("06/07/2026");
  });

  it("returns anything non-ISO unchanged (never invents a date)", () => {
    expect(formatDateIt("2026-Q4")).toBe("2026-Q4");
    expect(formatDateIt("")).toBe("");
  });
});

describe("todayInRome", () => {
  it("returns a YYYY-MM-DD string", () => {
    expect(todayInRome()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("segmentFigures", () => {
  it("isolates euro amounts for mono rendering", () => {
    expect(segmentFigures("Sanzioni fino a 200.000 € per vendita senza registrazione.")).toEqual([
      { text: "Sanzioni fino a ", mono: false },
      { text: "200.000 €", mono: true },
      { text: " per vendita senza registrazione.", mono: false },
    ]);
  });

  it("handles the € symbol before the amount and multiple figures", () => {
    const segments = segmentFigures("Contributo di € 80 oppure 5,16 € una tantum.");
    expect(segments.filter((s) => s.mono).map((s) => s.text)).toEqual(["€ 80", "5,16 €"]);
  });

  it("returns the whole text as one segment when there are no figures", () => {
    expect(segmentFigures("Nessuna soglia esonera dall'obbligo.")).toEqual([
      { text: "Nessuna soglia esonera dall'obbligo.", mono: false },
    ]);
  });
});
