# CLAUDE_CODE_KICKOFF.md — Sequenza di lavoro per Claude Code
Aggiornato: 10/07/2026. Questo file riflette lo stato reale del progetto.

## Stato lavori — GIÀ FATTO (non rifare)
- ✅ Ricerca regole EPR DE/FR/IT: completata via Claude Research.
  Il report con i tre blocchi YAML è in `docs/ricerca-regole-epr.md`.
- ✅ Riferimento visivo: 4 schermate create con Claude Design
  (risultato checker, step checker, hero landing, dashboard),
  esportate nella cartella del progetto. Sono IL riferimento
  estetico per i Prompt 3, 4 e 5.
- ✅ DESIGN_SYSTEM.md e ARCHITECTURE.md: definitivi.
- ✅ PROMPT 1–5 eseguiti (scaffold, motore, checker, landing, app):
  dettaglio in STATO_PROGETTO.md §3. Resta SOLO il Prompt 6.
- ✅ Pricing ratificato il 10/07/2026: 2 piani annuali (Essenziale
  149€, Completo 249€), niente mensile — il Prompt 6 qui sotto è
  già allineato.

## Regole di lavoro (già nel CLAUDE.md della root)
```
- DESIGN_SYSTEM.md e ARCHITECTURE.md sono legge. Se devi deviare, fermati
  e segnala prima di procedere.
- L'export di Claude Design è il riferimento visivo: le schermate
  implementate devono corrispondergli, adattandolo ai componenti reali.
- Lavora su main. Non creare branch. Non committare: lascia le modifiche
  unstaged, le revisiono e committo io.
- Ogni dato normativo nei file /rules DEVE avere una fonte ufficiale in
  `sources`. Valore senza fonte = null + TODO-VERIFY. Mai inventare
  valori normativi.
- Il motore di regole (checkObligations, generateDeadlines, computeReport)
  richiede unit test. Nessuna feature sopra il motore senza test verdi.
- Codice e commenti in inglese. Testi UI in italiano, in file di
  localizzazione (it.json) dal primo giorno.
- Niente AI/LLM nel prodotto. Logica deterministica.
```

## Ordine di esecuzione e modello per ciascun prompt
1 (Opus 4.8) → 2 (Fable 5) → 3 (Fable 5) → 4 (Opus 4.8) → 5 (Opus 4.8) → 6 (Opus 4.8).
I prompt 1–5 sono FATTI. Il 6 (Stripe) è flusso di pagamento, non
meccanica: va fatto con Opus 4.8 (o Fable 5 se ancora disponibile),
decisione ratificata 10/07/2026.

---

## PROMPT 1 — Scaffold (Opus 4.8)
```
Leggi ARCHITECTURE.md e DESIGN_SYSTEM.md. Crea il progetto: Next.js 15
App Router + TypeScript + Tailwind + shadcn/ui.
1. Configura i token di DESIGN_SYSTEM.md (colori, font Archivo /
   Instrument Sans / IBM Plex Mono via next/font, radius, scala
   tipografica) come tema Tailwind + shadcn.
2. Crea la migration Supabase con lo schema SQL di ARCHITECTURE.md §3,
   incluse le policy RLS.
3. Struttura route come da §2, con placeholder minimi.
4. Crea rules/de.yaml, rules/fr.yaml, rules/it.yaml estraendo
   ESATTAMENTE i tre blocchi YAML da docs/ricerca-regole-epr.md,
   senza modificare nessun valore, mantenendo status: draft e tutti
   i TODO-VERIFY.
5. Script scripts/validate-rules.ts: valida i file /rules/*.yaml con
   schema Zod e li seeda nella tabella countries.
6. Setup PostHog e Resend (chiavi da .env, crea .env.example).
Non costruire ancora UI vera: solo fondamenta solide e tipizzate.
```

## PROMPT 2 — Motore di regole + test (Fable 5)
```
Leggi ARCHITECTURE.md §4-5 e i file /rules. Implementa in lib/engine/
le tre funzioni pure: checkObligations, generateDeadlines,
computeReport, con tipi TS espliciti per input/output.
Unit test (Vitest) per: azienda IT che vende solo in DE; azienda IT
che vende in DE+FR+IT; azienda extra-UE; SKU senza pesi (deve produrre
un errore actionable, non un report sbagliato); conversione tassonomia
canonica → categorie locali (LUCID, Citeo, CONAI); generazione scadenze
a cavallo d'anno; periodicità variabile CONAI in base al CAC.
Il motore legge le regole dai YAML, mai valori hardcoded.
I campi marcati TODO-VERIFY o uncertain nei YAML devono propagarsi
nell'output come flag `uncertain: true`, mai presentati come certi.
```

## PROMPT 3 — Checker /check (Fable 5)
```
Leggi ARCHITECTURE.md §6, DESIGN_SYSTEM.md (tutto, in particolare §5
firma visiva e §8 principi) e guarda l'export di Claude Design:
le schermate "step checker" e "risultato checker" sono il riferimento
da riprodurre con i componenti reali del progetto.
Costruisci il checker: 5 step + risultato, collegato al motore di
regole (checkObligations), mai a valori hardcoded.
- Una domanda per schermata, barra progresso, transizioni sobrie,
  tutto navigabile da tastiera.
- Risultato: card per paese con sigillo di stato, rischi con cifre e
  fonte + data di verifica dal YAML, footer con disclaimer legale.
  CTA primaria = email gate (salva in leads, invia report via Resend);
  CTA secondaria outline = registrazione.
- Le 3 card entrano con 80ms di stagger, prefers-reduced-motion
  rispettato.
- Traccia ogni step in PostHog (checker_step_1 ... checker_result,
  checker_email_submitted).
- Nessun login richiesto. Mobile perfetto fino a 360px.
```

## PROMPT 4 — Landing / (Opus 4.8)
```
Leggi DESIGN_SYSTEM.md e l'export di Claude Design (schermata hero:
è il riferimento per la parte alta). Costruisci la landing:
1. Hero come da riferimento, CTA unica → /check.
2. Il dolore: 3 situazioni concrete (portale in tedesco, delisting
   Amazon, scadenze diverse) — testi reali, niente lorem.
3. Come funziona: 3 passi (check gratuito → dati imballaggi → report
   pronti da incollare).
4. Prezzi (3 tier come ARCHITECTURE.md §8).
5. FAQ (6 domande vere su EPR, risposte coerenti coi dati in /rules)
   + footer con disclaimer legale.
SEO: metadata, OG, sitemap, schema.org FAQPage.
```

## PROMPT 5 — App autenticata /app (Opus 4.8)
```
Leggi ARCHITECTURE.md §2-3-7, DESIGN_SYSTEM.md §8 e l'export di
Claude Design (schermata dashboard: è il riferimento). Costruisci /app:
- Onboarding post-signup: crea azienda → seleziona paesi → primo stato.
- Dashboard come da riferimento: card-paese con sigillo, banner
  progresso configurazione con azione mancante cliccabile, sezione
  prossime scadenze.
- /app/prodotti: tabella SKU + componenti imballaggio, aggiunta manuale
  e import CSV (mappatura colonne manuale, con preview e validazione).
- /app/report: seleziona paese+periodo → computeReport → vista per
  materiale in Plex Mono + copia negli appunti + export CSV.
- Cron Vercel per promemoria scadenze via Resend (30/7/1 giorni).
Ogni vista: stati empty/loading/error curati come da design system.
```

## PROMPT 6 — Stripe + legali (Opus 4.8)
```
Leggi ARCHITECTURE.md §8 (pricing ratificato 10/07/2026: SOLO
fatturazione annuale, 2 piani — Essenziale 149€/anno, Completo
249€/anno; il checker gratuito NON è un piano) e STATO_PROGETTO.md §7.
Vincolo chiave: account Stripe, chiavi e price ID reali NON esistono
ancora. Usa placeholder mock in .env.example e struttura tutto in modo
che basti sostituire i valori env, senza toccare codice.

1. Migration 0002: valori di companies.plan → free | essenziale |
   completo (decisione ratificata: rinominare, niente mappe
   starter/pro). Aggiorna default, commenti, tipi TS e ogni
   riferimento nel codice.
2. Config Stripe centralizzata in lib/stripe/: client server-side,
   mappa piano → price ID letta da env:
   STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET,
   NEXT_PUBLIC_STRIPE_PRICE_ESSENZIALE,
   NEXT_PUBLIC_STRIPE_PRICE_COMPLETO.
   Aggiorna .env.example (elimina le var STARTER/PRO).
3. Flusso acquisto (decisione ratificata: prima l'account, poi il
   checkout). Le CTA di landing e /prezzi continuano a puntare a
   /registrati. L'acquisto avviene da /app: pagina piano/upgrade che
   mostra piano attuale, i 2 piani con feature, CTA → route server
   che crea Stripe Checkout Session (mode: subscription, price
   annuale, customer riusato/creato via stripe_customer_id,
   success/cancel URL). Nel Checkout: billing_address_collection
   required + tax_id_collection abilitata (B2B, prezzi IVA esclusa);
   la P.IVA finisce sul customer per la fatturazione. NON attivare
   automatic_tax (richiede Stripe Tax configurato a mano: va in
   STRIPE_SETUP.md come decisione/step di Ion).
   Se già abbonato: link al Customer Portal (billing portal session)
   al posto del checkout.
4. Webhook /api/stripe/webhook: verifica firma; su
   checkout.session.completed e customer.subscription.updated /
   .deleted aggiorna companies.plan e stripe_customer_id con service
   role (mai fidarsi del client). Gestione idempotente.
5. Gating per piano, enforce LATO SERVER oltre che in UI (decisione
   ratificata sul free: dashboard sì, output no):
   - free: onboarding, dashboard con sigilli e scadenze, gestione
     SKU. BLOCCATI: report, promemoria email, import CSV, storico
     report → empty state curato con CTA upgrade (design system,
     non un semplice disabled).
   - essenziale: max 3 paesi (blocco alla selezione del 4°, con
     copy che propone Completo), niente import CSV né storico.
   - completo: tutto, inclusi paesi futuri.
   Centralizza le regole in lib/plans.ts (funzioni pure) con unit
   test Vitest. Il cron promemoria filtra i piani non paganti.
6. Pagine legali: completa /privacy (oggi placeholder) e crea
   /termini — contenuto reale in it.json, dati societari (ragione
   sociale, indirizzo, P.IVA) come placeholder marcati. Cookie
   banner minimo: PostHog parte solo dopo consenso.
7. Crea STRIPE_SETUP.md alla root: checklist di TUTTO ciò che deve
   fare Ion a mano — creare account Stripe, prodotti + 2 price
   annuali, incollare chiavi e price ID in .env.local/Vercel,
   registrare l'endpoint webhook (e ottenere il whsec), configurare
   il Customer Portal nel dashboard Stripe, completare i dati
   societari nelle pagine legali. Ogni valore mock lasciato nel
   codice/env DEVE comparire in questa checklist.
Eventi PostHog: upgrade_viewed, checkout_started, checkout_completed.
Build, lint e tutti i test devono restare verdi.
```

---

## Verifiche umane (Ion, non delegabili)
1. Stato della proposta COM/2025/982 → determina cosa dire sul
   rappresentante autorizzato (incertezza n.1 della ricerca)
2. Le altre 9 incertezze in coda a docs/ricerca-regole-epr.md,
   in ordine di gravità, prima di mettere status: verified nei YAML
3. Review del codice unstaged dopo ogni prompt, poi commit manuale

## Dopo i 2 giorni (con Opus/Sonnet)
- Guide-paese SEO (/guide/de ecc.) generate dai file /rules
- Prompt 6 se slittato, rifiniture UI
- Post nei gruppi FBA Italia col checker → inizia la validazione reale
