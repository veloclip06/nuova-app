import type { CompanyCountryStatus } from "@/lib/engine/types";

/**
 * Database row shapes for the authenticated app area (mirror of the tables in
 * supabase/migrations/0001_init.sql / ARCHITECTURE.md §3). Hand-written rather
 * than generated so the app layer stays dependency-free; keep in sync with the
 * migration. snake_case here (DB); the engine mappers convert to camelCase.
 */

export type { CompanyCountryStatus };

export interface CompanyRow {
  id: string;
  owner_id: string;
  name: string;
  establishment_country: string;
  vat_number: string | null;
  plan: string;
  stripe_customer_id: string | null;
  created_at: string;
}

export interface CountryRow {
  code: string;
  name: string;
  register_name: string;
  authority: string;
  portal_url: string;
  rules_version: string;
}

export interface CompanyCountryRow {
  company_id: string;
  country_code: string;
  registration_number: string | null;
  status: CompanyCountryStatus;
  annual_volume_band: string | null;
}

export interface SkuRow {
  id: string;
  company_id: string;
  sku_code: string;
  name: string | null;
  source: string;
}

export interface PackagingComponentRow {
  id: string;
  sku_id: string;
  material: string;
  /** numeric(10,2) — PostgREST may serialise as number or string. */
  weight_grams: number | string;
  note: string | null;
}

export interface SalesVolumeRow {
  id: string;
  company_id: string;
  sku_id: string;
  country_code: string;
  period: string;
  units: number;
}

export interface DeadlineRow {
  id: string;
  company_id: string;
  country_code: string;
  kind: string;
  due_date: string;
  status: string;
  reminder_sent_at: string | null;
}
