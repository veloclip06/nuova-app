import { getCompanyContext } from "@/lib/app/company";
import { getSkusWithComponents } from "@/lib/app/products";
import { t } from "@/lib/i18n";
import { AppMain } from "@/components/app/app-main";
import { PageHeader } from "@/components/app/page-header";
import { ProductsClient, type ProductVM } from "@/components/app/products-client";

export default async function ProductsPage() {
  const context = await getCompanyContext();
  if (!context) return null;

  const { skus, components } = await getSkusWithComponents(context.company.id);
  const componentsBySku = new Map<string, typeof components>();
  for (const component of components) {
    const list = componentsBySku.get(component.sku_id) ?? [];
    list.push(component);
    componentsBySku.set(component.sku_id, list);
  }

  const products: ProductVM[] = skus.map((sku) => {
    const list = componentsBySku.get(sku.id) ?? [];
    return {
      id: sku.id,
      skuCode: sku.sku_code,
      name: sku.name,
      source: sku.source,
      materials: list.map((c) => c.material),
      totalWeightGrams: list.reduce((sum, c) => sum + Number(c.weight_grams || 0), 0),
    };
  });

  return (
    <AppMain>
      <PageHeader
        eyebrow={t("app.products.eyebrow")}
        title={t("app.products.title")}
        subtitle={t("app.products.subtitle")}
      />
      <ProductsClient products={products} />
    </AppMain>
  );
}
