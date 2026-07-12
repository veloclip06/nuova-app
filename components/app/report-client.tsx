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
  // Mirrors of sourced rule fields (register.portal_url, sources[].accessed,
  // status) — display only, never invented here.
  portalUrl: string;
  sourceAccessed: string;
  ruleStatus: "draft" | "verified";
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
  historyVisible,
}: {
  countries: ReportCountry[];
  skus: ReportSku[];
  volumes: ReportVolume[];
  historyVisible: boolean;
}) {
  const [countryCode, setCountryCode] = React.useState(countries[0]?.code ?? "");
  const [period, setPeriod] = React.useState("");
  const [unitsBySku, setUnitsBySku] = React.useState<Record<string, string>>({});
  const [result, setResult] = React.useState<ReportActionResult | null>(null);
  const [pending, setPending] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  // Inputs signature of the last successful generation: when the current
  // inputs diverge, the shown result is stale and the CTA flips to "Ricalcola".
  const [generatedKey, setGeneratedKey] = React.useState<string | null>(null);
  // Country snapshot taken at generation time, so the result header keeps
  // naming the register it was computed for even if the selection changes.
  const [generatedCountry, setGeneratedCountry] = React.useState<ReportCountry | undefined>(undefined);
  // Remount key for the result view so the card-enter micro-state replays.
  const [generation, setGeneration] = React.useState(0);

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

  const country = countries.find((c) => c.code === countryCode);
  const canGenerate = countryCode !== "" && period.trim() !== "" && !pending;
  const stale =
    result?.ok === true &&
    generatedKey !== null &&
    inputsKey(countryCode, period, unitsBySku, skus) !== generatedKey;

  async function onGenerate() {
    setPending(true);
    setCopied(false);
    const payload = skus.map((sku) => ({
      skuId: sku.id,
      units: Math.trunc(Number(unitsBySku[sku.id] ?? "0")) || 0,
    }));
    const res = await generateReport({ countryCode, period: period.trim(), volumes: payload });
    setResult(res);
    if (res.ok) {
      setGeneratedKey(inputsKey(countryCode, period, unitsBySku, skus));
      setGeneratedCountry(country);
      setGeneration((g) => g + 1);
    }
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
          {pending
            ? t("app.report.generating")
            : stale
              ? t("app.report.regenerate")
              : t("app.report.generate")}
        </Button>
      </div>

      {!result && (
        <div className="rounded-lg border border-dashed border-line bg-surface/50 p-6 text-sm text-muted-foreground">
          {t("app.report.selectPrompt")}
        </div>
      )}

      {stale && (
        <p role="status" className="rounded-md border border-line bg-paper px-4 py-2.5 text-2xs text-muted-foreground">
          {t("app.report.stale")}
        </p>
      )}

      {result && !result.ok && <ReportErrors errors={result.errors} />}
      {result && result.ok && (
        <ReportResultView
          key={generation}
          report={result.report}
          country={generatedCountry}
          historyVisible={historyVisible}
          copied={copied}
          onCopy={async () => {
            await navigator.clipboard.writeText(buildTsv(result.report));
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
          }}
          onExport={() =>
            downloadCsv(
              `report-${generatedCountry?.registerName ?? countryCode}-${result.report.period}.csv`,
              buildCsv(result.report),
            )
          }
        />
      )}
    </div>
  );
}

function ReportErrors({ errors }: { errors: { code: string; skuCode?: string }[] }) {
  return (
    <div className="animate-card-enter rounded-lg border border-risk/40 bg-risk/[0.04] p-6">
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
  country,
  historyVisible,
  copied,
  onCopy,
  onExport,
}: {
  report: MaterialBreakdown;
  country: ReportCountry | undefined;
  historyVisible: boolean;
  copied: boolean;
  onCopy: () => void;
  onExport: () => void;
}) {
  const register = country?.registerName ?? "";
  // The peak-end moment: land keyboard/screen-reader focus on the document
  // header once per (re)generation (the parent remounts this view via key).
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  React.useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="animate-card-enter flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow text-muted-foreground">{t("app.report.result.eyebrow")}</p>
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="mt-1 font-display text-xl font-semibold text-ink focus-visible:outline-none"
          >
            {t("app.report.result.title", { register })}{" "}
            <span className="tabular text-base font-normal text-muted-foreground">
              · {report.period}
            </span>
          </h2>
          {country && (
            <p className="mt-1.5 text-2xs text-muted-foreground">
              {t("app.report.result.sourceMeta", {
                register,
                date: new Date(country.sourceAccessed).toLocaleDateString("it-IT"),
              })}
              {country.ruleStatus === "draft" && (
                <span className="ml-1.5 inline-block whitespace-nowrap rounded-sm border border-line bg-paper px-1.5 py-px align-middle font-mono text-[11px] leading-relaxed text-muted-foreground">
                  {t("app.report.result.draftBadge")}
                </span>
              )}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span role="status" className="text-2xs text-muted-foreground">
            {copied ? t("app.report.result.copied") : ""}
          </span>
          <Button variant="outline" size="sm" onClick={onCopy}>
            {t("app.report.result.copy")}
          </Button>
          <Button variant="ghost" size="sm" onClick={onExport}>
            {t("app.report.result.exportCsv")}
          </Button>
          {country && (
            <Button asChild variant="ghost" size="sm">
              <a href={country.portalUrl} target="_blank" rel="noopener noreferrer">
                {t("app.report.result.openPortal", { register })}
              </a>
            </Button>
          )}
        </div>
      </div>

      {report.uncertain && (
        <p className="rounded-md border border-warn/40 bg-warn/[0.06] px-4 py-2.5 text-2xs text-warn">
          {t("app.report.result.draftNotice")}
        </p>
      )}

      {/* Per-material (canonical) view — what users always see (§5) */}
      <div className="rounded-lg border border-line bg-surface">
        <div className="border-b border-line px-5 py-3">
          <p className="eyebrow text-muted-foreground">{t("app.report.result.materialView")}</p>
          <p className="mt-1 text-2xs text-muted-foreground">
            {t("app.report.result.materialViewHint")}
          </p>
        </div>
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
        <div className="border-b border-line px-5 py-3">
          <p className="eyebrow text-muted-foreground">{t("app.report.result.portalView")}</p>
          <p className="mt-1 text-2xs text-muted-foreground">
            {t("app.report.result.portalViewHint", { register })}
          </p>
        </div>
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
        {t(historyVisible ? "app.report.result.saved" : "app.report.result.savedNoHistory")}
      </p>
    </div>
  );
}

// --- helpers ---------------------------------------------------------------

/**
 * Signature of the inputs a generation runs on. Units are normalised exactly
 * like onGenerate's payload, so "" vs "0" vs "05" never reads as a change.
 */
function inputsKey(
  countryCode: string,
  period: string,
  unitsBySku: Record<string, string>,
  skus: ReportSku[],
): string {
  const units = skus
    .map((sku) => `${sku.id}:${Math.trunc(Number(unitsBySku[sku.id] ?? "0")) || 0}`)
    .join(",");
  return `${countryCode}|${period.trim()}|${units}`;
}

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
