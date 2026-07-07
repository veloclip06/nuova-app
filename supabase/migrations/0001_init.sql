-- Cockpit EPR — initial schema
-- Mirrors ARCHITECTURE.md §3. RLS is enabled on every table; user tables are
-- scoped to the owning company (owner_id = auth.uid()), `countries` is public
-- read-only, and `leads` is insert-only for anonymous checker submissions.

-- Extensions ---------------------------------------------------------------
create extension if not exists "pgcrypto";  -- gen_random_uuid()

-- Tables -------------------------------------------------------------------

-- Azienda del venditore (1 utente = 1 azienda nel MVP)
create table companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  name text not null,
  establishment_country char(2) not null,      -- dove è stabilita
  vat_number text,
  plan text not null default 'free',            -- free | starter | pro
  stripe_customer_id text,
  created_at timestamptz default now()
);

-- Paesi coperti dal prodotto (seed da /rules)
create table countries (
  code char(2) primary key,                     -- 'DE','FR','IT'
  name text not null,
  register_name text not null,                  -- 'LUCID', ...
  authority text not null,
  portal_url text not null,
  rules_version text not null                   -- versione del file regole caricato
);

-- Stato dell'azienda in ogni paese in cui vende
create table company_countries (
  company_id uuid references companies(id) on delete cascade,
  country_code char(2) references countries(code),
  registration_number text,                     -- es. numero LUCID
  status text not null default 'not_registered',
    -- not_registered | in_progress | registered
  annual_volume_band text,                      -- fascia ordini/anno dichiarata
  primary key (company_id, country_code)
);

-- Catalogo prodotti
create table skus (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  sku_code text not null,
  name text,
  source text default 'manual',                 -- manual | csv | amazon_report
  unique (company_id, sku_code)
);

-- Componenti di imballaggio per SKU (il cuore dei dati)
create table packaging_components (
  id uuid primary key default gen_random_uuid(),
  sku_id uuid not null references skus(id) on delete cascade,
  material text not null,                        -- tassonomia canonica, v. §5
  weight_grams numeric(10,2) not null check (weight_grams >= 0),
  note text
);

-- Volumi venduti per paese e periodo
create table sales_volumes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  sku_id uuid not null references skus(id) on delete cascade,
  country_code char(2) not null references countries(code),
  period text not null,                          -- '2026' o '2026-Q3' secondo il paese
  units integer not null check (units >= 0),
  unique (company_id, sku_id, country_code, period)
);

-- Scadenze generate dal motore per ogni azienda
create table deadlines (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  country_code char(2) not null references countries(code),
  kind text not null,                            -- registration | report | payment
  due_date date not null,
  status text not null default 'open',           -- open | done | overdue
  reminder_sent_at timestamptz
);

-- Report generati (storico)
create table reports (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  country_code char(2) not null,
  period text not null,
  payload jsonb not null,                        -- breakdown per materiale
  created_at timestamptz default now()
);

-- Lead dal checker (email gate)
create table leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  answers jsonb not null,                        -- risposte del checker
  result jsonb not null,                         -- esito calcolato
  created_at timestamptz default now()
);

-- Helpful indexes ----------------------------------------------------------
create index idx_companies_owner on companies (owner_id);
create index idx_company_countries_company on company_countries (company_id);
create index idx_skus_company on skus (company_id);
create index idx_packaging_components_sku on packaging_components (sku_id);
create index idx_sales_volumes_company on sales_volumes (company_id);
create index idx_deadlines_company on deadlines (company_id);
create index idx_deadlines_due on deadlines (due_date) where status = 'open';
create index idx_reports_company on reports (company_id);

-- Row Level Security -------------------------------------------------------
alter table companies             enable row level security;
alter table countries             enable row level security;
alter table company_countries     enable row level security;
alter table skus                  enable row level security;
alter table packaging_components  enable row level security;
alter table sales_volumes         enable row level security;
alter table deadlines             enable row level security;
alter table reports               enable row level security;
alter table leads                 enable row level security;

-- companies: an authenticated user only sees / edits their own company.
create policy "companies_select_own" on companies
  for select using (owner_id = auth.uid());
create policy "companies_insert_own" on companies
  for insert with check (owner_id = auth.uid());
create policy "companies_update_own" on companies
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "companies_delete_own" on companies
  for delete using (owner_id = auth.uid());

-- countries: public reference data, read-only. Writes go through the
-- service-role seed script (scripts/validate-rules.ts), which bypasses RLS.
create policy "countries_public_read" on countries
  for select using (true);

-- Reusable predicate: the current user owns the given company.
-- Expressed inline in each policy since Postgres RLS can't reference a helper
-- without a SECURITY DEFINER function; kept identical across tables.

-- company_countries
create policy "company_countries_rw_own" on company_countries
  for all
  using (
    company_id in (select id from companies where owner_id = auth.uid())
  )
  with check (
    company_id in (select id from companies where owner_id = auth.uid())
  );

-- skus
create policy "skus_rw_own" on skus
  for all
  using (
    company_id in (select id from companies where owner_id = auth.uid())
  )
  with check (
    company_id in (select id from companies where owner_id = auth.uid())
  );

-- packaging_components: scoped through skus → companies.
create policy "packaging_components_rw_own" on packaging_components
  for all
  using (
    sku_id in (
      select s.id from skus s
      join companies c on c.id = s.company_id
      where c.owner_id = auth.uid()
    )
  )
  with check (
    sku_id in (
      select s.id from skus s
      join companies c on c.id = s.company_id
      where c.owner_id = auth.uid()
    )
  );

-- sales_volumes
create policy "sales_volumes_rw_own" on sales_volumes
  for all
  using (
    company_id in (select id from companies where owner_id = auth.uid())
  )
  with check (
    company_id in (select id from companies where owner_id = auth.uid())
  );

-- deadlines
create policy "deadlines_rw_own" on deadlines
  for all
  using (
    company_id in (select id from companies where owner_id = auth.uid())
  )
  with check (
    company_id in (select id from companies where owner_id = auth.uid())
  );

-- reports
create policy "reports_rw_own" on reports
  for all
  using (
    company_id in (select id from companies where owner_id = auth.uid())
  )
  with check (
    company_id in (select id from companies where owner_id = auth.uid())
  );

-- leads: the public checker writes leads without login. Anyone may INSERT;
-- nobody may SELECT/UPDATE/DELETE via the API (only the service role, which
-- bypasses RLS, reads them for the Resend report + analytics).
create policy "leads_public_insert" on leads
  for insert with check (true);
