"use client";

import * as React from "react";
import { t } from "@/lib/i18n";
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
  const [deleting, setDeleting] = React.useState<string | null>(null);
  // The action revalidates /app/prodotti itself; the transition keeps the row
  // disabled through the streamed re-render — no router.refresh() needed.
  const [, startTransition] = React.useTransition();

  function onDelete(product: ProductVM) {
    if (!window.confirm(t("app.products.table.deleteConfirm", { sku: product.skuCode }))) return;
    setDeleting(product.id);
    startTransition(async () => {
      await deleteProduct(product.id);
      setDeleting(null);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => setPanel(panel === "add" ? "none" : "add")}>
          {t("app.products.addButton")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPanel(panel === "import" ? "none" : "import")}
        >
          {t("app.products.importButton")}
        </Button>
      </div>

      {feedback && (
        <p role="status" className="text-2xs text-ok">
          {feedback}
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

      {products.length === 0 ? (
        <div className="rounded-lg border border-line bg-surface p-8 text-base text-muted-foreground">
          {t("app.products.empty")}
        </div>
      ) : (
        <div className="rounded-lg border border-line bg-surface">
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
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-mono font-medium">{product.skuCode}</TableCell>
                  <TableCell className="text-muted-foreground">{product.name ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {product.materials.map((m) => t(`app.materials.${m}`)).join(", ")}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatGrams(product.totalWeightGrams)} g
                  </TableCell>
                  <TableCell>
                    <Badge tone={product.source === "csv" ? "brand" : "neutral"} filled>
                      {product.source === "csv"
                        ? t("app.products.sourceCsv")
                        : t("app.products.sourceManual")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      type="button"
                      disabled={deleting === product.id}
                      onClick={() => onDelete(product)}
                      className="rounded-sm text-2xs text-muted-foreground hover:text-risk disabled:opacity-50"
                    >
                      {t("app.products.table.delete")}
                    </button>
                  </TableCell>
                </TableRow>
              ))}
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
