"use client";

import * as React from "react";
import { t } from "@/lib/i18n";
import { MonoDigits } from "@/components/mono-digits";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ProductForm } from "./product-form";
import { CsvImport } from "./csv-import";
import { UpgradeGate } from "./upgrade-gate";
import { deleteProduct } from "@/app/app/prodotti/actions";

export interface ProductVM {
  id: string;
  skuCode: string;
  name: string | null;
  source: string;
  materials: string[];
  totalWeightGrams: number;
}

type Panel = "none" | "add" | "import";

export function ProductsClient({
  products,
  csvEnabled,
}: {
  products: ProductVM[];
  /** CSV import is completo-only: the panel renders the upgrade gate instead. */
  csvEnabled: boolean;
}) {
  const [panel, setPanel] = React.useState<Panel>("none");
  const [feedback, setFeedback] = React.useState<string | null>(null);
  // The row awaiting its second (confirming) click — inline destructive
  // confirmation instead of a native dialog (DESIGN_SYSTEM.md §8.7).
  const [confirmingId, setConfirmingId] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState<string | null>(null);
  // The action revalidates /app/prodotti itself; the transition keeps the row
  // disabled through the streamed re-render — no router.refresh() needed.
  const [, startTransition] = React.useTransition();
  // Move focus onto the inline confirm so keyboard focus is never lost when the
  // row swaps its delete button for the confirmation (quality floor §10).
  const confirmRef = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (confirmingId) confirmRef.current?.focus();
  }, [confirmingId]);

  function openPanel(next: Panel) {
    setPanel((prev) => (prev === next ? "none" : next));
    setFeedback(null);
    setConfirmingId(null);
  }

  function confirmDelete(product: ProductVM) {
    setConfirmingId(null);
    setDeleting(product.id);
    startTransition(async () => {
      await deleteProduct(product.id);
      setDeleting(null);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => openPanel("add")}>
          {t("app.products.addButton")}
        </Button>
        <Button variant="outline" size="sm" onClick={() => openPanel("import")}>
          {t("app.products.importButton")}
        </Button>
      </div>

      {feedback && (
        <p
          role="status"
          className="rounded-md border border-ok/40 bg-ok/[0.06] px-4 py-2.5 text-xs text-ok"
        >
          <MonoDigits text={feedback} />
        </p>
      )}

      {panel === "add" && (
        <ProductForm
          onSaved={() => {
            setPanel("none");
            setFeedback(t("app.products.form.saved"));
          }}
          onCancel={() => setPanel("none")}
        />
      )}

      {panel === "import" &&
        (csvEnabled ? (
          <CsvImport
            onDone={(count) => {
              setPanel("none");
              setFeedback(t("app.products.import.done", { count }));
            }}
            onCancel={() => setPanel("none")}
          />
        ) : (
          <UpgradeGate feature="csvImport" variant="inline" />
        ))}

      {products.length === 0
        ? panel === "none" && (
            <div className="flex flex-col items-start gap-3 rounded-lg border border-line bg-surface p-8">
              <p className="font-display text-lg font-semibold text-ink">
                {t("app.products.emptyTitle")}
              </p>
              <p className="max-w-[52ch] text-sm text-muted-foreground">{t("app.products.empty")}</p>
              <Button variant="outline" size="sm" className="mt-1" onClick={() => openPanel("add")}>
                {t("app.products.emptyCta")}
              </Button>
            </div>
          )
        : (
            <div className="rounded-lg border border-line bg-surface">
              <div className="border-b border-line px-5 py-3">
                <span className="font-mono text-2xs uppercase tracking-register text-muted-foreground">
                  {t("app.products.table.count", { count: products.length })}
                </span>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("app.products.table.sku")}</TableHead>
                    <TableHead>{t("app.products.table.name")}</TableHead>
                    <TableHead>{t("app.products.table.components")}</TableHead>
                    <TableHead className="text-right">{t("app.products.table.totalWeight")}</TableHead>
                    <TableHead>{t("app.products.table.source")}</TableHead>
                    <TableHead className="text-right">{t("app.products.table.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => {
                    const confirming = confirmingId === product.id;
                    return (
                      <TableRow key={product.id} className={confirming ? "bg-risk/[0.04]" : undefined}>
                        <TableCell className="font-mono font-medium">{product.skuCode}</TableCell>
                        <TableCell className="text-muted-foreground">{product.name ?? "—"}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {product.materials.map((m) => t(`app.materials.${m}`)).join(", ")}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatGrams(product.totalWeightGrams)}{" "}
                          <span className="text-muted-foreground">g</span>
                        </TableCell>
                        <TableCell>
                          <Badge tone={product.source === "csv" ? "brand" : "neutral"}>
                            {product.source === "csv"
                              ? t("app.products.sourceCsv")
                              : t("app.products.sourceManual")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {confirming ? (
                            <div className="flex items-center justify-end gap-3 whitespace-nowrap">
                              <span className="text-2xs text-muted-foreground">
                                {t("app.products.table.deleteConfirm", { sku: product.skuCode })}
                              </span>
                              <button
                                ref={confirmRef}
                                type="button"
                                onClick={() => confirmDelete(product)}
                                className="rounded-sm text-2xs font-medium text-risk hover:underline"
                              >
                                {t("app.products.table.delete")}
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmingId(null)}
                                className="rounded-sm text-2xs text-muted-foreground hover:text-ink"
                              >
                                {t("app.products.table.cancel")}
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              disabled={deleting === product.id}
                              onClick={() => setConfirmingId(product.id)}
                              className="rounded-sm text-2xs text-muted-foreground hover:text-risk disabled:opacity-50"
                            >
                              {t("app.products.table.delete")}
                            </button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
    </div>
  );
}

/** Grams with at most 2 decimals, Italian separators. */
function formatGrams(grams: number): string {
  return grams.toLocaleString("it-IT", { maximumFractionDigits: 2 });
}
