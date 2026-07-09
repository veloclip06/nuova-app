import { CANONICAL_MATERIALS, type CanonicalMaterial } from "@/lib/rules/schema";

/**
 * Dependency-free CSV import for the products page (ARCHITECTURE.md §8 / PROMPT 5):
 * parse → manual column mapping → per-row validation → grouped SKUs. Pure and
 * fully unit-tested. Deterministic — no guessing of normative values, only of
 * ergonomic defaults (delimiter, column mapping) the user can override.
 */

export interface CsvTable {
  delimiter: string;
  header: string[];
  rows: string[][];
}

/** Italian Excel exports use ";"; also support tab. Pick the most frequent in the header line. */
function detectDelimiter(firstLine: string): string {
  const candidates = [",", ";", "\t"];
  let best = ",";
  let bestCount = -1;
  for (const candidate of candidates) {
    const count = firstLine.split(candidate).length - 1;
    if (count > bestCount) {
      bestCount = count;
      best = candidate;
    }
  }
  return best;
}

/** Parse CSV text (RFC 4180 quoting, auto delimiter, BOM-tolerant) into header + rows. */
export function parseCsv(text: string): CsvTable {
  const clean = text.replace(/^﻿/, "");
  const delimiter = detectDelimiter(clean.split(/\r?\n/, 1)[0] ?? "");

  const records: string[][] = [];
  let field = "";
  let record: string[] = [];
  let inQuotes = false;
  let i = 0;

  while (i < clean.length) {
    const ch = clean[i];
    if (inQuotes) {
      if (ch === '"') {
        if (clean[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += ch;
      i += 1;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (ch === delimiter) {
      record.push(field);
      field = "";
      i += 1;
      continue;
    }
    if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && clean[i + 1] === "\n") i += 1;
      record.push(field);
      field = "";
      records.push(record);
      record = [];
      i += 1;
      continue;
    }
    field += ch;
    i += 1;
  }
  if (field.length > 0 || record.length > 0) {
    record.push(field);
    records.push(record);
  }

  // Drop blank lines (a single empty field).
  const nonEmpty = records.filter((r) => !(r.length === 1 && r[0].trim() === ""));
  const header = nonEmpty.length > 0 ? nonEmpty[0].map((h) => h.trim()) : [];
  const rows = nonEmpty.slice(1);
  return { delimiter, header, rows };
}

// --- Material normalisation ------------------------------------------------

/** Common IT/EN labels → canonical material (ARCHITECTURE.md §5). Extend, don't invent codes. */
const MATERIAL_ALIASES: Record<string, CanonicalMaterial> = {
  carta: "paper_cardboard",
  cartone: "paper_cardboard",
  "carta/cartone": "paper_cardboard",
  "carta e cartone": "paper_cardboard",
  ppk: "paper_cardboard",
  paper: "paper_cardboard",
  cardboard: "paper_cardboard",
  plastica: "plastic",
  vetro: "glass",
  acciaio: "ferrous_metal",
  ferro: "ferrous_metal",
  "banda stagnata": "ferrous_metal",
  steel: "ferrous_metal",
  tinplate: "ferrous_metal",
  alluminio: "aluminium",
  aluminum: "aluminium",
  legno: "wood",
  "poliaccoppiato bevande": "composite_beverage",
  "cartone per bevande": "composite_beverage",
  "beverage carton": "composite_beverage",
  tetrapak: "composite_beverage",
  "tetra pak": "composite_beverage",
  poliaccoppiato: "composite_other",
  composito: "composite_other",
  composite: "composite_other",
  altro: "other",
  altri: "other",
};

/** Raw material label → canonical id, or null when unrecognised (an actionable row error). */
export function normalizeMaterial(raw: string): CanonicalMaterial | null {
  const key = raw.trim().toLowerCase().replace(/\s+/g, " ");
  if ((CANONICAL_MATERIALS as readonly string[]).includes(key)) {
    return key as CanonicalMaterial;
  }
  return MATERIAL_ALIASES[key] ?? null;
}

/** Weight string → grams (handles IT decimal comma and thousands dot). null = invalid/blank. */
export function parseWeightGrams(raw: string): number | null {
  let s = raw.trim().replace(/\s/g, "");
  if (s === "") return null;
  const hasComma = s.includes(",");
  const hasDot = s.includes(".");
  if (hasComma && hasDot) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (hasComma) {
    s = s.replace(",", ".");
  }
  const grams = Number(s);
  if (!Number.isFinite(grams) || grams < 0) return null;
  return grams;
}

// --- Mapping + validation --------------------------------------------------

export interface ColumnMapping {
  skuCode: number;
  name: number | null;
  material: number;
  weightGrams: number;
}

export type RowErrorCode = "MISSING_SKU_CODE" | "UNKNOWN_MATERIAL" | "INVALID_WEIGHT";

export interface ParsedProductRow {
  /** 1-based data-row number (header excluded), for the preview. */
  rowNumber: number;
  skuCode: string;
  name: string;
  materialRaw: string;
  material: CanonicalMaterial | null;
  weightRaw: string;
  weightGrams: number | null;
  errors: RowErrorCode[];
}

/** Suggest a column mapping from header names (smart defaults, DESIGN_SYSTEM.md §8.9). */
export function guessMapping(header: string[]): Partial<ColumnMapping> {
  const hints: Record<keyof ColumnMapping, string[]> = {
    skuCode: ["sku_code", "sku", "codice", "code", "cod"],
    name: ["name", "nome", "descrizione", "description", "titolo"],
    material: ["material", "materiale", "materia"],
    weightGrams: ["weight_grams", "peso_grammi", "weight", "peso", "grammi", "grams", "grammi"],
  };
  const lower = header.map((h) => h.trim().toLowerCase());
  const find = (needles: string[]): number | undefined => {
    for (const needle of needles) {
      const idx = lower.findIndex((h) => h === needle || h.includes(needle));
      if (idx !== -1) return idx;
    }
    return undefined;
  };
  const mapping: Partial<ColumnMapping> = {};
  const sku = find(hints.skuCode);
  if (sku !== undefined) mapping.skuCode = sku;
  const name = find(hints.name);
  if (name !== undefined) mapping.name = name;
  const material = find(hints.material);
  if (material !== undefined) mapping.material = material;
  const weight = find(hints.weightGrams);
  if (weight !== undefined) mapping.weightGrams = weight;
  return mapping;
}

/** Validate every data row against a column mapping, collecting per-row errors. */
export function validateRows(rows: string[][], mapping: ColumnMapping): ParsedProductRow[] {
  return rows.map((cells, index) => {
    const get = (col: number | null): string => (col === null ? "" : (cells[col] ?? "").trim());
    const skuCode = get(mapping.skuCode);
    const name = get(mapping.name);
    const materialRaw = get(mapping.material);
    const weightRaw = get(mapping.weightGrams);
    const material = normalizeMaterial(materialRaw);
    const weightGrams = parseWeightGrams(weightRaw);

    const errors: RowErrorCode[] = [];
    if (!skuCode) errors.push("MISSING_SKU_CODE");
    if (!material) errors.push("UNKNOWN_MATERIAL");
    if (weightGrams === null) errors.push("INVALID_WEIGHT");

    return {
      rowNumber: index + 1,
      skuCode,
      name,
      materialRaw,
      material,
      weightRaw,
      weightGrams,
      errors,
    };
  });
}

export interface ImportComponent {
  material: CanonicalMaterial;
  weightGrams: number;
}

export interface ImportSku {
  skuCode: string;
  name: string | null;
  components: ImportComponent[];
}

/** Collapse valid rows into SKUs (rows sharing a sku_code become one SKU with many components). */
export function groupIntoSkus(rows: ParsedProductRow[]): ImportSku[] {
  const bySku = new Map<string, ImportSku>();
  for (const row of rows) {
    if (row.errors.length > 0 || !row.material || row.weightGrams === null) continue;
    let sku = bySku.get(row.skuCode);
    if (!sku) {
      sku = { skuCode: row.skuCode, name: row.name || null, components: [] };
      bySku.set(row.skuCode, sku);
    }
    if (!sku.name && row.name) sku.name = row.name;
    sku.components.push({ material: row.material, weightGrams: row.weightGrams });
  }
  return [...bySku.values()];
}
