# CLAUDE_CODE_KICKOFF.md — Sequenza di lavoro per Claude Code
Aggiornato: 07/07/2026. Questo file riflette lo stato reale del progetto.

## Stato lavori — GIÀ FATTO (non rifare)
- ✅ Ricerca regole EPR DE/FR/IT: completata via Claude Research.
  Il report con i tre blocchi YAML è in `docs/ricerca-regole-epr.md`.
- ✅ Riferimento visivo: 4 schermate create con Claude Design
  (risultato checker, step checker, hero landing, dashboard),
  esportate nella cartella del progetto. Sono IL riferimento
  estetico per i Prompt 3, 4 e 5.
- ✅ DESIGN_SYSTEM.md e ARCHITECTURE.md: definitivi.

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
1 (Opus 4.8) → 2 (Fable 5) → 3 (Fable 5) → 4 (Opus 4.8) → 5 (Opus 4.8) → 6 (Sonnet 4.6).
I prompt 2 e 3 sono il cuore: vanno fatti con Fable 5 finché è disponibile.
Il 6 può slittare senza problemi: è lavoro standard.

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

## PROMPT 6 — Stripe + rifiniture (Sonnet 4.6, può slittare)
```
Stripe Checkout per i 3 tier di ARCHITECTURE.md §8 (mensile/annuale),
webhook per aggiornare companies.plan, gating feature per piano,
Customer Portal per gestione abbonamento. Pagine legali: privacy,
termini, cookie banner minimo.
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
