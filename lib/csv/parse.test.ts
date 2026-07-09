import { describe, expect, it } from "vitest";
import {
  groupIntoSkus,
  guessMapping,
  normalizeMaterial,
  parseCsv,
  parseWeightGrams,
  validateRows,
  type ColumnMapping,
} from "./parse";

describe("parseCsv", () => {
  it("parses a comma CSV with header + rows", () => {
    const table = parseCsv("sku,material,weight\nBOX-1,plastic,20\nBOX-1,carta,100\n");
    expect(table.delimiter).toBe(",");
    expect(table.header).toEqual(["sku", "material", "weight"]);
    expect(table.rows).toEqual([
      ["BOX-1", "plastic", "20"],
      ["BOX-1", "carta", "100"],
    ]);
  });

  it("auto-detects the semicolon delimiter (Italian Excel)", () => {
    const table = parseCsv("sku;materiale;peso\r\nBOX-1;plastica;12,5\r\n");
    expect(table.delimiter).toBe(";");
    expect(table.rows).toEqual([["BOX-1", "plastica", "12,5"]]);
  });

  it("honours quoted fields with embedded delimiters, quotes and newlines", () => {
    const table = parseCsv('sku,name,material,weight\n"BOX-1","Scatola, grande","carta",100\n');
    expect(table.rows[0]).toEqual(["BOX-1", "Scatola, grande", "carta", "100"]);
  });

  it("strips a BOM and ignores blank lines", () => {
    const table = parseCsv("﻿sku,material,weight\n\nBOX-1,plastic,20\n\n");
    expect(table.header).toEqual(["sku", "material", "weight"]);
    expect(table.rows).toEqual([["BOX-1", "plastic", "20"]]);
  });
});

describe("normalizeMaterial", () => {
  it("accepts canonical ids and IT/EN aliases, case-insensitively", () => {
    expect(normalizeMaterial("plastic")).toBe("plastic");
    expect(normalizeMaterial("Plastica")).toBe("plastic");
    expect(normalizeMaterial("  CARTA ")).toBe("paper_cardboard");
    expect(normalizeMaterial("Tetra Pak")).toBe("composite_beverage");
    expect(normalizeMaterial("acciaio")).toBe("ferrous_metal");
  });

  it("returns null for unknown materials", () => {
    expect(normalizeMaterial("kryptonite")).toBeNull();
    expect(normalizeMaterial("")).toBeNull();
  });
});

describe("parseWeightGrams", () => {
  it("parses dot and Italian comma decimals", () => {
    expect(parseWeightGrams("20")).toBe(20);
    expect(parseWeightGrams("12,5")).toBe(12.5);
    expect(parseWeightGrams("1.234,56")).toBeCloseTo(1234.56);
    expect(parseWeightGrams("0")).toBe(0);
  });

  it("rejects blanks and negatives", () => {
    expect(parseWeightGrams("")).toBeNull();
    expect(parseWeightGrams("abc")).toBeNull();
    expect(parseWeightGrams("-5")).toBeNull();
  });
});

describe("guessMapping", () => {
  it("suggests columns from header names", () => {
    expect(guessMapping(["sku_code", "nome", "materiale", "peso_grammi"])).toEqual({
      skuCode: 0,
      name: 1,
      material: 2,
      weightGrams: 3,
    });
  });
});

describe("validateRows + groupIntoSkus", () => {
  const mapping: ColumnMapping = { skuCode: 0, name: 1, material: 2, weightGrams: 3 };

  it("flags per-row errors and groups valid rows into SKUs", () => {
    const rows = [
      ["BOX-1", "Scatola", "carta", "100"],
      ["BOX-1", "Scatola", "plastica", "20"],
      ["", "Orfano", "vetro", "50"], // missing sku
      ["BOX-2", "Cassa", "kryptonite", "10"], // unknown material
      ["BOX-3", "Vaso", "vetro", "abc"], // invalid weight
    ];
    const parsed = validateRows(rows, mapping);
    expect(parsed[0].errors).toEqual([]);
    expect(parsed[2].errors).toContain("MISSING_SKU_CODE");
    expect(parsed[3].errors).toContain("UNKNOWN_MATERIAL");
    expect(parsed[4].errors).toContain("INVALID_WEIGHT");

    const skus = groupIntoSkus(parsed);
    expect(skus).toEqual([
      {
        skuCode: "BOX-1",
        name: "Scatola",
        components: [
          { material: "paper_cardboard", weightGrams: 100 },
          { material: "plastic", weightGrams: 20 },
        ],
      },
    ]);
  });
});
