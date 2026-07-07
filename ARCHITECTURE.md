# ARCHITECTURE.md — Cockpit EPR

## 1. Stack (deciso, non riaprire)
- **Next.js 15 (App Router) + TypeScript** — serve SEO vero su landing, checker e guide-paese: sono il motore di distribuzione.
- **Tailwind + shadcn/ui** — personalizzati coi token di DESIGN_SYSTEM.md.
- **Supabase** (Postgres + Auth, regione EU) — database e login. RLS attiva su tutte le tabelle utente.
- **Stripe** — abbonamenti (Checkout + Customer Portal, niente UI di billing custom).
- **Resend** — email transazionali e promemoria scadenze.
- **PostHog** — analytics + funnel del checker (dove abbandonano = oro).
- **Vercel** — deploy.
- **AI nel prodotto: nessuna nel MVP.** Il core è un motore di regole deterministico. (Post-MVP opzionale: LLM economico per suggerire la mappatura colonne nei CSV anomali. Periferia, mai core.)

## 2. Mappa delle route
```
PUBBLICHE (SSR/statiche, indicizzabili)
/                    Landing
/check               Checker a step (senza login)
/check/risultato     Risultato + email gate per report dettagliato
/guide/[paese]       Guida SEO per paese (de, fr, it) — generate dai file regole
/prezzi              Pricing 3 tier

APP (autenticata, /app/*)
/app                 Dashboard: card-paese con sigillo stato + prossime scadenze
/app/paesi/[code]    Dettaglio paese: registrazione, scadenze, cosa serve
/app/prodotti        Tabella SKU + imballaggi, import CSV
/app/report          Genera report per paese/periodo
/app/impostazioni    Azienda, abbonamento (link a Stripe Portal)

AUTH: /login /registrati /reset-password (Supabase Auth, email+password e Google)
```

## 3. Schema database (Postgres / Supabase)
```sql
-- Azienda del venditore (1 utente = 1 azienda nel MVP)
create table companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  name text not null,
  establishment_country char(2) not null,     -- dove è stabilita
  vat_number text,
  plan text not null default 'free',           -- free | starter | pro
  stripe_customer_id text,
  created_at timestamptz default now()
);

-- Paesi coperti dal prodotto (seed da /rules)
create table countries (
  code char(2) primary key,                    -- 'DE','FR','IT'
  name text not null,
  register_name text not null,                 -- 'LUCID', ...
  authority text not null,
  portal_url text not null,
  rules_version text not null                  -- versione del file regole caricato
);

-- Stato dell'azienda in ogni paese in cui vende
create table company_countries (
  company_id uuid references companies(id) on delete cascade,
  country_code char(2) references countries(code),
  registration_number text,                    -- es. numero LUCID
  status text not null default 'not_registered',
    -- not_registered | in_progress | registered
  annual_volume_band text,                     -- fascia ordini/anno dichiarata
  primary key (company_id, country_code)
);

-- Catalogo prodotti
create table skus (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  sku_code text not null,
  name text,
  source text default 'manual',                -- manual | csv | amazon_report
  unique (company_id, sku_code)
);

-- Componenti di imballaggio per SKU (il cuore dei dati)
create table packaging_components (
  id uuid primary key default gen_random_uuid(),
  sku_id uuid not null references skus(id) on delete cascade,
  material text not null,                      -- tassonomia canonica, v. §5
  weight_grams numeric(10,2) not null check (weight_grams >= 0),
  note text
);

-- Volumi venduti per paese e periodo
create table sales_volumes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  sku_id uuid not null references skus(id) on delete cascade,
  country_code char(2) not null references countries(code),
  period text not null,                        -- '2026' o '2026-Q3' secondo il paese
  units integer not null check (units >= 0),
  unique (company_id, sku_id, country_code, period)
);

-- Scadenze generate dal motore per ogni azienda
create table deadlines (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  country_code char(2) not null references countries(code),
  kind text not null,                          -- registration | report | payment
  due_date date not null,
  status text not null default 'open',         -- open | done | overdue
  reminder_sent_at timestamptz
);

-- Report generati (storico)
create table reports (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  country_code char(2) not null,
  period text not null,
  payload jsonb not null,                      -- breakdown per materiale
  created_at timestamptz default now()
);

-- Lead dal checker (email gate)
create table leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  answers jsonb not null,                      -- risposte del checker
  result jsonb not null,                       -- esito calcolato
  created_at timestamptz default now()
);
```
RLS: ogni tabella con `company_id` filtra su `owner_id = auth.uid()` via join. `countries` e regole sono pubbliche in lettura.

## 4. Motore di regole (il core, zero AI)
Le regole vivono in **file YAML versionati nel repo** (`/rules/de.yaml`, `fr.yaml`, `it.yaml`) — vedi rules-template.yaml. A build time uno script li valida (schema Zod) e li seeda. Tre funzioni pure, testate con unit test:

```ts
// 1. Dato il profilo, cosa deve fare e dove
checkObligations(input: CheckerInput): CountryObligation[]
// input: paese stabilimento, paesi di vendita, canali, tipi prodotto, fasce volume
// output per paese: obbligato sì/no, registro, adempimenti, prossima scadenza,
//                   livello rischio, fonti

// 2. Genera le scadenze concrete per l'azienda
generateDeadlines(company, rules): Deadline[]

// 3. Calcola il report: per ogni materiale, somma(peso_g × unità vendute)
computeReport(company, country, period): MaterialBreakdown
// converte la tassonomia canonica nelle categorie locali del paese (es. LUCID)
```
I test unitari sul motore sono obbligatori: è logica di compliance, un errore qui è il rischio esistenziale del prodotto.

## 5. Tassonomia materiali (canonica)
`paper_cardboard · plastic · glass · ferrous_metal · aluminium · wood · composite_beverage · composite_other · other`
Ogni file regole-paese contiene la mappatura dalle categorie canoniche a quelle locali (nomi e codici del registro nazionale). L'utente vede sempre quelle canoniche in italiano; la conversione avviene solo nel report.

## 6. Spec del checker (route /check)
Step, uno per schermata, con barra progresso:
1. Dove è stabilita la tua azienda? (select paese)
2. In quali paesi UE vendi? (multi-select con bandiere; MVP evidenzia DE/FR/IT, gli altri raccolgono interesse)
3. Su quali canali? (Amazon / eBay / Shopify / altro — multi)
4. Che tipo di prodotti spedisci? (categorie con default di imballaggio)
5. Quanti ordini/anno circa per paese? (fasce, slider o pill)
6. Risultato sintetico subito: card per paese con sigillo ESPOSTO/AZIONE RICHIESTA + rischi principali con fonte. Email gate: "Ricevi il report dettagliato con la checklist completa" → salva lead → invia via Resend → CTA registrazione app.
Regole: nessun login richiesto, salvataggio risposte in stato locale, funnel tracciato per step in PostHog.

## 7. Promemoria scadenze
Cron giornaliero (Vercel Cron) → query scadenze a 30/7/1 giorni → email via Resend → segna `reminder_sent_at`. Niente code, niente infrastruttura extra.

## 8. Pricing (MVP)
- **Free:** checker + 1 paese in sola visualizzazione scadenze
- **Starter 29€/mese:** 2 paesi, SKU illimitati, report, promemoria
- **Pro 59€/mese:** tutti i paesi coperti, import CSV, storico report
Stripe Checkout, mensile/annuale (-20%). Nessuna telefonata, nessun "contattaci".

## 9. Legale e fiducia (nel MVP, non dopo)
- Footer fisso: "Software di supporto alla conformità. Non costituisce consulenza legale."
- Ogni dato normativo mostrato: fonte ufficiale linkata + data ultima verifica (dal YAML).
- Privacy policy + cookie banner minimi, dati in regione EU.
