"use client";

import * as React from "react";
import Link from "next/link";
import type { MaterialBreakdown } from "@/lib/engine/types";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { generateReport, type ReportActionResult } from "@/app/app/report/actions";

interface ReportCountry {
  code: string;
  name: string;
  registerName: string;
}
interface ReportSku {
  id: string;
  skuCode: string;
  name: string | null;
}
interface ReportVolume {
  skuId: string;
  countryCode: string;
  period: string;
  units: number;
}

export function ReportClient({
  countries,
  skus,
  volumes,
}: {
  countries: ReportCountry[];
  skus: ReportSku[];
  volumes: ReportVolume[];
}) {
  const [countryCode, setCountryCode] = React.useState(countries[0]?.code ?? "");
  const [period, setPeriod] = React.useState("");
  const [unitsBySku, setUnitsBySku] = React.useState<Record<string, string>>({});
  const [result, setResult] = React.useState<ReportActionResult | null>(null);
  const [pending, setPending] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  // Prefill volumes from what was saved for this country + period.
  React.useEffect(() => {
    if (!countryCode || !period) return;
    const prefill: Record<string, string> = {};
    for (const volume of volumes) {
      if (volume.countryCode === countryCode && volume.period === period) {
        prefill[volume.skuId] = String(volume.units);
      }
    }
    setUnitsBySku(prefill);
  }, [countryCode, period, volumes]);

  const register = countries.find((c) => c.code === countryCode)?.registerName ?? countryCode;
  const canGenerate = countryCode !== "" && period.trim() !== "" && !pending;

  async function onGenerate() {
    setPending(true);
    setCopied(false);
    const payload = skus.map((sku) => ({
      skuId: sku.id,
      units: Math.trunc(Number(unitsBySku[sku.id] ?? "0")) || 0,
    }));
    const res = await generateReport({ countryCode, period: period.trim(), volumes: payload });
    setResult(res);
    setPending(false);
  }

  if (skus.length === 0) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-lg border border-line bg-surface p-8">
        <p className="text-base text-muted-foreground">{t("app.report.noProducts")}</p>
        <Button asChild variant="outline" size="sm">
          <Link href="/app/prodotti">{t("app.report.noProductsCta")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Selection */}
      <div className="flex flex-wrap items-end gap-4 rounded-lg border border-line bg-surface p-5">
        <div className="flex min-w-[180px] flex-col gap-1.5">
          <Label htmlFor="country">{t("app.report.countryLabel")}</Label>
          <Select id="country" value={countryCode} onChange={(e) => setCountryCode(e.target.value)}>
            {countries.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name} · {country.registerName}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex min-w-[160px] flex-col gap-1.5">
          <Label htmlFor="period">{t("app.report.periodLabel")}</Label>
          <Input
            id="period"
            className="font-mono"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            placeholder={t("app.report.periodPlaceholder")}
          />
        </div>
      </div>

      {/* Volumes */}
      <div className="rounded-lg border border-line bg-surface">
        <div className="border-b border-line px-5 py-4">
          <p className="font-display text-base font-semibold text-ink">
            {t("app.report.volumesTitle")}
          </p>
          <p className="mt-1 text-2xs text-muted-foreground">{t("app.report.volumesHelp")}</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("app.products.table.sku")}</TableHead>
              <TableHead>{t("app.products.table.name")}</TableHead>
              <TableHead className="text-right">{t("app.report.unitsLabel")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {skus.map((sku) => (
              <TableRow key={sku.id}>
                <TableCell className="font-mono font-medium">{sku.skuCode}</TableCell>
                <TableCell className="text-muted-foreground">{sku.name ?? "—"}</TableCell>
                <TableCell className="text-right">
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    aria-label={`${t("app.report.unitsLabel")} ${sku.skuCode}`}
                    className="ml-auto w-28 text-right font-mono"
                    value={unitsBySku[sku.id] ?? ""}
                    onChange={(e) =>
                      setUnitsBySku((prev) => ({ ...prev, [sku.id]: e.target.value }))
                    }
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div>
        <Button onClick={onGenerate} disabled={!canGenerate}>
          {pending ? t("app.common.saving") : t("app.report.generate")}
        </Button>
      </div>

      {result && !result.ok && <ReportErrors errors={result.errors} />}
      {result && result.ok && (
        <ReportResultView
          report={result.report}
          register={register}
          copied={copied}
          onCopy={async () => {
            await navigator.clipboard.writeText(buildTsv(result.report));
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
          }}
          onExport={() =>
            downloadCsv(`report-${register}-${result.report.period}.csv`, buildCsv(result.report))
          }
        />
      )}
    </div>
  );
}

function ReportErrors({ errors }: { errors: { code: string; skuCode?: string }[] }) {
  return (
    <div className="rounded-lg border border-risk/40 bg-risk/[0.04] p-6">
      <p className="font-display text-base font-semibold text-risk">
        {t("app.report.errors.title")}
      </p>
      <ul className="mt-3 flex flex-col gap-1.5 text-xs text-ink">
        {errors.map((error, index) => (
          <li key={index}>
            {translateError(error.code, error.skuCode)}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-2xs text-muted-foreground">{t("app.report.errors.hint")}</p>
    </div>
  );
}

function ReportResultView({
  report,
  register,
  copied,
  onCopy,
  onExport,
}: {
  report: MaterialBreakdown;
  register: string;
  copied: boolean;
  onCopy: () => void;
  onExport: () => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-ink">
          {t("app.report.result.title", { register, period: report.period })}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onCopy}>
            {copied ? t("app.report.result.copied") : t("app.report.result.copy")}
          </Button>
          <Button variant="ghost" size="sm" onClick={onExport}>
            {t("app.report.result.exportCsv")}
          </Button>
        </div>
      </div>

      {report.uncertain && (
        <p className="rounded-md border border-warn/40 bg-warn/[0.06] px-4 py-2.5 text-2xs text-warn">
          {t("app.report.result.draftNotice")}
        </p>
      )}

      {/* Per-material (canonical) view — what users always see (§5) */}
      <div className="rounded-lg border border-line bg-surface">
        <p className="eyebrow border-b border-line px-5 py-3 text-muted-foreground">
          {t("app.report.result.materialView")}
        </p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("app.report.result.material")}</TableHead>
              <TableHead>{t("app.report.result.localCategory")}</TableHead>
              <TableHead>{t("app.report.result.code")}</TableHead>
              <TableHead className="text-right">{t("app.report.result.weightKg")}</TableHead>
              <TableHead className="text-right">{t("app.report.result.units")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report.rows.map((row) => (
              <TableRow key={row.canonical}>
                <TableCell>{t(`app.materials.${row.canonical}`)}</TableCell>
                <TableCell className="text-muted-foreground">{row.localName}</TableCell>
                <TableCell className="font-mono text-muted-foreground">{row.localCode ?? "—"}</TableCell>
                <TableCell className="text-right font-mono">{row.totalWeightKg.toFixed(3)}</TableCell>
                <TableCell className="text-right font-mono">{row.units}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Portal-paste view — merged by local register category */}
      <div className="rounded-lg border border-line bg-surface">
        <p className="eyebrow border-b border-line px-5 py-3 text-muted-foreground">
          {t("app.report.result.portalView")}
        </p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("app.report.result.localCategory")}</TableHead>
              <TableHead>{t("app.report.result.code")}</TableHead>
              <TableHead className="text-right">{t("app.report.result.weightKg")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report.byLocalCategory.map((category) => (
              <TableRow key={`${category.localName}-${category.localCode ?? ""}`}>
                <TableCell>{category.localName}</TableCell>
                <TableCell className="font-mono text-muted-foreground">
                  {category.localCode ?? "—"}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {category.totalWeightKg.toFixed(3)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <p role="status" className="text-2xs text-muted-foreground">
        {t("app.report.result.saved")}
      </p>
    </div>
  );
}

// --- helpers ---------------------------------------------------------------

function translateError(code: string, skuCode?: string): string {
  const key = `app.report.errors.${code}`;
  const translated = t(key, skuCode ? { sku: skuCode } : undefined);
  return translated === key ? t("app.report.errors.generic") : translated;
}

function materialRows(report: MaterialBreakdown): string[][] {
  const header = [
    t("app.report.result.material"),
    t("app.report.result.localCategory"),
    t("app.report.result.code"),
    t("app.report.result.weightKg"),
    t("app.report.result.units"),
  ];
  const body = report.rows.map((row) => [
    t(`app.materials.${row.canonical}`),
    row.localName,
    row.localCode ?? "",
    row.totalWeightKg.toFixed(3),
    String(row.units),
  ]);
  return [header, ...body];
}

function buildTsv(report: MaterialBreakdown): string {
  return materialRows(report)
    .map((cols) => cols.join("\t"))
    .join("\n");
}

function buildCsv(report: MaterialBreakdown): string {
  const escape = (value: string) =>
    /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
  return materialRows(report)
    .map((cols) => cols.map(escape).join(","))
    .join("\n");
}

function downloadCsv(filename: string, text: string) {
  const blob = new Blob([`﻿${text}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
