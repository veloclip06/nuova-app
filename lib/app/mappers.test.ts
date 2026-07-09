import { describe, expect, it } from "vitest";
import {
  toCheckerInput,
  toCompanyProfile,
  toSkuInputs,
  toVolumeInputs,
} from "./mappers";
import type {
  CompanyCountryRow,
  CompanyRow,
  PackagingComponentRow,
  SalesVolumeRow,
  SkuRow,
} from "./types";

const company: CompanyRow = {
  id: "c1",
  owner_id: "u1",
  name: "Rossi Commerce Srl",
  establishment_country: "IT",
  vat_number: "IT123",
  plan: "free",
  stripe_customer_id: null,
  created_at: "2026-01-01T00:00:00Z",
};

const companyCountries: CompanyCountryRow[] = [
  { company_id: "c1", country_code: "DE", registration_number: null, status: "not_registered", annual_volume_band: null },
  { company_id: "c1", country_code: "IT", registration_number: "IT-123", status: "registered", annual_volume_band: null },
];

describe("toCheckerInput", () => {
  it("maps establishment + selling countries, empty channels by default", () => {
    const input = toCheckerInput(company, companyCountries, "2026-07-09");
    expect(input).toEqual({
      establishmentCountry: "IT",
      sellingCountries: ["DE", "IT"],
      channels: [],
      referenceDate: "2026-07-09",
    });
  });
});

describe("toCompanyProfile", () => {
  it("carries per-country status", () => {
    const profile = toCompanyProfile(company, companyCountries);
    expect(profile.establishmentCountry).toBe("IT");
    expect(profile.countries).toEqual([
      { countryCode: "DE", status: "not_registered" },
      { countryCode: "IT", status: "registered" },
    ]);
  });
});

describe("toSkuInputs", () => {
  const skus: SkuRow[] = [
    { id: "s1", company_id: "c1", sku_code: "BOX-1", name: "Box", source: "manual" },
    { id: "s2", company_id: "c1", sku_code: "BOX-2", name: null, source: "csv" },
  ];
  const components: PackagingComponentRow[] = [
    { id: "p1", sku_id: "s1", material: "paper_cardboard", weight_grams: "100.00", note: null },
    { id: "p2", sku_id: "s1", material: "plastic", weight_grams: 20, note: null },
    { id: "p3", sku_id: "s2", material: "glass", weight_grams: "", note: null },
  ];

  it("groups components by sku and coerces numeric(10,2) strings", () => {
    const result = toSkuInputs(skus, components);
    expect(result).toEqual([
      {
        skuCode: "BOX-1",
        components: [
          { material: "paper_cardboard", weightGrams: 100 },
          { material: "plastic", weightGrams: 20 },
        ],
      },
      {
        skuCode: "BOX-2",
        components: [{ material: "glass", weightGrams: null }],
      },
    ]);
  });

  it("a SKU with no components maps to an empty component list", () => {
    const result = toSkuInputs([skus[0]], []);
    expect(result).toEqual([{ skuCode: "BOX-1", components: [] }]);
  });
});

describe("toVolumeInputs", () => {
  const skus: SkuRow[] = [
    { id: "s1", company_id: "c1", sku_code: "BOX-1", name: "Box", source: "manual" },
  ];
  const volumes: SalesVolumeRow[] = [
    { id: "v1", company_id: "c1", sku_id: "s1", country_code: "DE", period: "2026", units: 1200 },
    { id: "v2", company_id: "c1", sku_id: "s-unknown", country_code: "DE", period: "2026", units: 5 },
  ];

  it("resolves sku_id → sku_code and drops volumes for unknown SKUs", () => {
    expect(toVolumeInputs(volumes, skus)).toEqual([{ skuCode: "BOX-1", units: 1200 }]);
  });
});
