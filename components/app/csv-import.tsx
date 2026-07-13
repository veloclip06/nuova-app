"use client";

import * as React from "react";
import {
  groupIntoSkus,
  guessMapping,
  parseCsv,
  validateRows,
  type ColumnMapping,
  type ParsedProductRow,
} from "@/lib/csv/parse";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { MonoDigits } from "@/components/mono-digits";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { importProducts } from "@/app/app/prodotti/actions";

type Step = "upload" | "map" | "preview";
type MappableField = keyof ColumnMapping;

/**
 * CSV product import (PROMPT 5): upload → manual column mapping → preview with
 * inline validation → confirm. Parsing/validation is the pure, tested
 * lib/csv/parse; this only orchestrates and renders (DESIGN_SYSTEM.md §8.7).
 */
export function CsvImport({
  onDone,
  onCancel,
}: {
  onDone: (count: number) => void;
  onCancel: () => void;
}) {
  const [step, setStep] = React.useState<Step>("upload");
  const [header, setHeader] = React.useState<string[]>([]);
  const [rows, setRows] = React.useState<string[][]>([]);
  const [mapping, setMapping] = React.useState<Partial<ColumnMapping>>({});
  const [error, setError] = React.useState<string | null>(null);
  // The action revalidates /app/prodotti itself — no router.refresh() needed.
  const [pending, startTransition] = React.useTransition();

  async function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const table = parseCsv(await file.text());
      if (table.header.length === 0 || table.rows.length === 0) {
        setError(t("app.products.import.errorParse"));
        return;
      }
      setHeader(table.header);
      setRows(table.rows);
      setMapping(guessMapping(table.header));
      setStep("map");
    } catch {
      setError(t("app.products.import.errorParse"));
    }
  }

  const mappingComplete =
    mapping.skuCode !== undefined && mapping.material !== undefined && mapping.weightGrams !== undefined;

  const parsed: ParsedProductRow[] = React.useMemo(() => {
    if (!mappingComplete) return [];
    return validateRows(rows, {
      skuCode: mapping.skuCode!,
      name: mapping.name ?? null,
      material: mapping.material!,
      weightGrams: mapping.weightGrams!,
    });
  }, [rows, mapping, mappingComplete]);

  const validCount = parsed.filter((r) => r.errors.length === 0).length;
  const errorRows = parsed.filter((r) => r.errors.length > 0);
  const skus = React.useMemo(() => groupIntoSkus(parsed), [parsed]);

  function setField(field: MappableField, raw: string, optional: boolean) {
    setMapping((prev) => ({
      ...prev,
      [field]: raw === "" ? (optional ? null : undefined) : Number(raw),
    }));
  }

  function goPreview() {
    if (!mappingComplete) {
      setError(t("app.products.import.errorMapping"));
      return;
    }
    setError(null);
    setStep("preview");
  }

  function confirm() {
    if (skus.length === 0) {
      setError(t("app.products.import.errorNoValid"));
      return;
    }
    startTransition(async () => {
      const result = await importProducts(
        skus.map((s) => ({ skuCode: s.skuCode, name: s.name, components: s.components })),
      );
      if (result.error) {
        setError(t("app.products.import.errorGeneric"));
        return;
      }
      onDone(result.imported);
    });
  }

  return (
    <div className="flex flex-col gap-5 rounded-lg border border-line bg-surface p-6">
      <div className="flex items-center justify-between">
        <p className="font-display text-base font-semibold text-ink">
          {t("app.products.import.title")}
        </p>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-sm text-2xs text-muted-foreground hover:text-ink"
        >
          {t("app.products.import.cancel")}
        </button>
      </div>

      {step === "upload" && (
        <div className="flex flex-col gap-3">
          <p className="text-2xs text-muted-foreground">{t("app.products.import.help")}</p>
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line bg-paper px-6 py-10 text-center transition-colors hover:border-brand">
            <span className="text-xs font-medium text-brand">{t("app.products.import.pick")}</span>
            <input type="file" accept=".csv,text/csv" className="sr-only" onChange={onFile} />
          </label>
        </div>
      )}

      {step === "map" && (
        <div className="flex flex-col gap-4">
          <div>
            <p className="eyebrow text-muted-foreground">{t("app.products.import.mapTitle")}</p>
            <p className="mt-1 text-2xs text-muted-foreground">{t("app.products.import.mapHelp")}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <ColumnSelect
              header={header}
              label={t("app.products.import.colSku")}
              value={mapping.skuCode}
              onChange={(raw) => setField("skuCode", raw, false)}
            />
            <ColumnSelect
              header={header}
              label={t("app.products.import.colName")}
              value={mapping.name}
              optional
              onChange={(raw) => setField("name", raw, true)}
            />
            <ColumnSelect
              header={header}
              label={t("app.products.import.colMaterial")}
              value={mapping.material}
              onChange={(raw) => setField("material", raw, false)}
            />
            <ColumnSelect
              header={header}
              label={t("app.products.import.colWeight")}
              value={mapping.weightGrams}
              onChange={(raw) => setField("weightGrams", raw, false)}
            />
          </div>
          <div className="flex items-center gap-3">
            <Button type="button" size="sm" onClick={goPreview} disabled={!mappingComplete}>
              {t("common.next")}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setStep("upload")}>
              {t("app.products.import.back")}
            </Button>
          </div>
        </div>
      )}

      {step === "preview" && (
        <div className="flex flex-col gap-4">
          <div>
            <p className="eyebrow text-muted-foreground">{t("app.products.import.previewTitle")}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-2xs">
              <span className="text-ok">
                <MonoDigits text={t("app.products.import.previewValid", { count: validCount })} />
              </span>
              {errorRows.length > 0 && (
                <span className="text-risk">
                  <MonoDigits
                    text={t("app.products.import.previewErrors", { count: errorRows.length })}
                  />
                </span>
              )}
              <span className="text-muted-foreground">
                <MonoDigits text={t("app.products.import.previewSkus", { count: skus.length })} />
              </span>
            </div>
          </div>

          <PreviewTable rows={parsed.slice(0, 10)} />

          {errorRows.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <p className="eyebrow text-muted-foreground">
                {t("app.products.import.previewErrorsTitle")}
              </p>
              <ul className="flex flex-col gap-1 text-2xs text-risk">
                {errorRows.slice(0, 5).map((row) => (
                  <li key={row.rowNumber}>
                    <MonoDigits text={t("app.products.import.rowLabel", { n: row.rowNumber })} />
                    {": "}
                    {row.errors.map((code) => t(`app.products.rowErrors.${code}`)).join(", ")}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button type="button" size="sm" onClick={confirm} disabled={pending || skus.length === 0}>
              {pending
                ? t("app.common.saving")
                : t("app.products.import.confirm", { count: skus.length })}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setStep("map")}>
              {t("app.products.import.back")}
            </Button>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="text-2xs text-risk">
          {error}
        </p>
      )}
    </div>
  );
}

function ColumnSelect({
  header,
  label,
  value,
  optional,
  onChange,
}: {
  header: string[];
  label: string;
  value: number | null | undefined;
  optional?: boolean;
  onChange: (raw: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <Select
        value={value === undefined || value === null ? "" : String(value)}
        onChange={(e) => onChange(e.target.value)}
      >
        {optional ? (
          <option value="">{t("app.products.import.colNone")}</option>
        ) : (
          <option value="" disabled>
            —
          </option>
        )}
        {header.map((columnName, index) => (
          <option key={index} value={index}>
            {columnName || `#${index + 1}`}
          </option>
        ))}
      </Select>
    </div>
  );
}

function PreviewTable({ rows }: { rows: ParsedProductRow[] }) {
  return (
    <div className="rounded-md border border-line">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("app.products.import.colSku")}</TableHead>
            <TableHead>{t("app.products.import.colMaterial")}</TableHead>
            <TableHead className="text-right">{t("app.products.import.colWeight")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.rowNumber} className={row.errors.length > 0 ? "bg-risk/[0.04]" : undefined}>
              <TableCell className={row.errors.includes("MISSING_SKU_CODE") ? "text-risk" : undefined}>
                {row.skuCode || "—"}
              </TableCell>
              <TableCell className={row.errors.includes("UNKNOWN_MATERIAL") ? "text-risk" : undefined}>
                {row.material ? t(`app.materials.${row.material}`) : row.materialRaw || "—"}
              </TableCell>
              <TableCell
                className={cn(
                  "text-right font-mono",
                  row.errors.includes("INVALID_WEIGHT") && "text-risk",
                )}
              >
                {row.weightGrams !== null ? row.weightGrams : row.weightRaw || "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
