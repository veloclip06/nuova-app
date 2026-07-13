"use client";

import * as React from "react";
import { CANONICAL_MATERIALS } from "@/lib/rules/schema";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { createProduct } from "@/app/app/prodotti/actions";

interface ComponentRow {
  material: string;
  weight: string;
}

const ERROR_KEYS: Record<string, string> = {
  sku: "app.products.form.errorSku",
  components: "app.products.form.errorComponents",
  duplicate: "app.products.form.errorDuplicate",
};

/** Manual product entry (PROMPT 5): SKU + name + packaging components. */
export function ProductForm({ onSaved, onCancel }: { onSaved: () => void; onCancel: () => void }) {
  const [skuCode, setSkuCode] = React.useState("");
  const [name, setName] = React.useState("");
  const [components, setComponents] = React.useState<ComponentRow[]>([{ material: "", weight: "" }]);
  const [error, setError] = React.useState<string | null>(null);
  // The action revalidates /app/prodotti itself — no router.refresh() needed.
  const [pending, startTransition] = React.useTransition();
  // Keep component entry fluid: move focus to the new row's material select as
  // soon as it mounts (DESIGN_SYSTEM.md §8.12 — system state stays visible).
  const componentsRef = React.useRef<HTMLDivElement>(null);
  const focusLastOnAdd = React.useRef(false);

  React.useEffect(() => {
    if (!focusLastOnAdd.current) return;
    focusLastOnAdd.current = false;
    const selects = componentsRef.current?.querySelectorAll("select");
    selects?.[selects.length - 1]?.focus();
  }, [components.length]);

  function updateComponent(index: number, patch: Partial<ComponentRow>) {
    setComponents((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  }

  function addComponent() {
    focusLastOnAdd.current = true;
    setComponents((prev) => [...prev, { material: "", weight: "" }]);
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const parsed = components
      .filter((c) => c.material && c.weight.trim() !== "")
      .map((c) => ({ material: c.material, weightGrams: Number(c.weight.replace(",", ".")) }));

    startTransition(async () => {
      const result = await createProduct({ skuCode, name, components: parsed });
      if (result?.error) {
        setError(t(ERROR_KEYS[result.error] ?? "app.products.form.errorGeneric"));
        return;
      }
      onSaved();
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      aria-busy={pending}
      className="flex flex-col gap-5 rounded-lg border border-line bg-surface p-6"
    >
      <p className="font-display text-base font-semibold text-ink">{t("app.products.form.title")}</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sku">{t("app.products.form.skuLabel")}</Label>
          <Input
            id="sku"
            required
            value={skuCode}
            onChange={(e) => setSkuCode(e.target.value)}
            placeholder={t("app.products.form.skuPlaceholder")}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">{t("app.products.form.nameLabel")}</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("app.products.form.namePlaceholder")}
          />
        </div>
      </div>

      <div ref={componentsRef} className="flex flex-col gap-3">
        <Label>{t("app.products.form.componentsLabel")}</Label>
        {components.map((component, index) => (
          <div key={index} className="flex flex-wrap items-end gap-2">
            <div className="min-w-[160px] flex-1">
              <Select
                aria-label={t("app.products.form.materialLabel")}
                value={component.material}
                onChange={(e) => updateComponent(index, { material: e.target.value })}
              >
                <option value="" disabled>
                  {t("app.products.form.materialLabel")}
                </option>
                {CANONICAL_MATERIALS.map((material) => (
                  <option key={material} value={material}>
                    {t(`app.materials.${material}`)}
                  </option>
                ))}
              </Select>
            </div>
            <div className="w-36">
              <Input
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                aria-label={t("app.products.form.weightLabel")}
                placeholder={t("app.products.form.weightLabel")}
                className="font-mono"
                value={component.weight}
                onChange={(e) => updateComponent(index, { weight: e.target.value })}
              />
            </div>
            {components.length > 1 && (
              <button
                type="button"
                onClick={() => setComponents((prev) => prev.filter((_, i) => i !== index))}
                className="h-11 rounded-md px-3 text-2xs text-muted-foreground hover:text-risk"
              >
                {t("app.products.form.removeComponent")}
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addComponent}
          className="self-start rounded-sm text-2xs font-medium text-brand hover:underline"
        >
          + {t("app.products.form.addComponent")}
        </button>
      </div>

      {error && (
        <p role="alert" className="text-2xs text-risk">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? t("app.common.saving") : t("app.products.form.save")}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          {t("app.products.form.cancel")}
        </Button>
      </div>
    </form>
  );
}
