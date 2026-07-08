# STATO_PROGETTO.md — EPR Cockpit
Documento di handoff. Aggiornato: 08/07/2026, dopo il commit del lavoro PROMPT 3.
Va tenuto nel repo e aggiornato a ogni milestone. In una nuova chat, allegare questo file + ARCHITECTURE.md + DESIGN_SYSTEM.md + CLAUDE_CODE_KICKOFF.md.

## 1. Cos'è il prodotto
Web app B2B self-serve per piccoli venditori e-commerce (1-10 persone) che vendono in più paesi UE e devono rispettare gli obblighi EPR sugli imballaggi (registri nazionali: LUCID/Germania, Citeo-SYDEREP/Francia, CONAI/Italia). Funnel: checker gratuito (/check) come lead magnet → abbonamento 29-79€/mese per scadenzario, dati imballaggi per SKU e report pronti da incollare nei portali ufficiali.

Posizionamento strategico (non negoziabile): siamo un layer software SOPRA i sistemi/PRO esistenti. NON facciamo da rappresentante autorizzato, NON presentiamo dichiarazioni per conto del cliente, NON vendiamo licenze. Disclaimer legale fisso: "Software di supporto alla conformità. Non costituisce consulenza legale." Zero AI nel prodotto: motore di regole deterministico.

## 2. Stack e servizi
Next.js 15 App Router + TypeScript + Tailwind + shadcn/ui · Supabase (Postgres+Auth, regione EU) · Stripe (non ancora configurato) · Resend · PostHog (account non ancora creato) · Vercel (account non ancora creato, nessun deploy).
Stato servizi: Supabase COLLEGATO (migration 0001 applicata, seed fatto: countries = DE/FR/IT, RLS verificata — leads insert-only confermato con test). Resend COLLEGATO in modalità test: RESEND_FROM usa onboarding@resend.dev → consegna SOLO all'email di registrazione; TODO dominio verificato prima del lancio pubblico. Nome/dominio del prodotto: NON ancora decisi ("EPR Cockpit" è placeholder).

## 3. Stato avanzamento
- ✅ Ricerca normativa DE/FR/IT (Claude Research) → docs/ricerca-regole-epr.md, con 10 incertezze da verificare a mano in coda al documento
- ✅ 4 mockup Claude Design (risultato checker, step checker, hero landing, dashboard) → export nel repo, riferimento visivo per i prompt UI
- ✅ PROMPT 1 (Opus): scaffold — token design system, migration Supabase (9 tabelle+RLS), route placeholder, rules/*.yaml estratti verbatim dalla ricerca, script validate/seed, i18n it.json dal giorno 1
- ✅ PROMPT 2 (Fable): motore di regole in lib/engine/ — checkObligations / generateDeadlines / computeReport, funzioni pure, 57 test. YAML estesi con campi strutturati che duplicano valori già sourced (mai nuovi valori normativi). Incertezza = dato di prima classe (uncertain: true propagato)
- ✅ PROMPT 3 (Fable): checker completo — wizard 5 step, risultato con sigilli, email gate (ricalcolo server-side, lead mai persa: fallback log recuperabile), /api/leads, /privacy placeholder, 93 test totali verdi
- ✅ DB inizializzato e primo test E2E manuale riuscito: wizard → risultato → email ricevuta → lead salvata
- ✅ Lavoro PROMPT 3 committato
- ⬜ PROMPT 4 landing (Opus) · ⬜ PROMPT 5 app autenticata (Opus) · ⬜ giro di rifinitura UI · ⬜ PROMPT 6 Stripe+legali (Sonnet) · ⬜ deploy Vercel · ⬜ verifica umana delle 10 incertezze → status: verified nei YAML · ⬜ nome+dominio · ⬜ post nei gruppi FBA Italia (inizio validazione)

## 4. Decisioni chiave ratificate (fanno fede sul mockup dove confliggono)
1. SIGILLO = stato legale; CLAIM di rischio = enforcement confermato. Estero obbligato non coperto → ESPOSTO sempre (indipendente dal canale). Domestico → AZIONE RICHIESTA con copy CONAI dedicato. riskLevel modula le righe di rischio nella card, non il sigillo: high (marketplace+blocco confermato) → riga delisting; medium → solo sanzioni con fonte; dato incerto → badge "in verifica", mai claim di blocco.
2. Microcopy sotto il titolo del risultato: risultato calcolato assumendo utente non ancora registrato.
3. Mai "verificato il" finché rules status: draft → si mostra "consultata il {data}" + badge "dati in verifica". "Verificato il" comparirà solo con last_verified_by_human valorizzato.
4. /check/risultato: noindex,follow + canonical /check (deviazione dichiarata da ARCHITECTURE §2).
5. CTA: max 1 primaria per schermata. Nel risultato: primaria = email gate; secondaria outline = registrazione.
6. Sigillo ha 4 stati: CONFORME (ok) / AZIONE RICHIESTA (warn) / ESPOSTO (risk) / NON OBBLIGATO (neutro: bordo line, testo ink — mai verde).
7. Zero dark pattern. Incertezza sempre dichiarata, mai nascosta. Fonte+data su ogni dato normativo mostrato.
8. Palette estesa con muted-ink #5A6B76 e placeholder #8A97A0 (ratificato, in DESIGN_SYSTEM §3).
9. Motore: mai indovinare — CAC mancante → scadenza uncertain; scadenze condizionali emesse con flag conditional, mai omesse; date mai inventate (dueDate: null).
10. Flag domestic: boolean su CountryObligation per differenziare il copy del caso domestico nella UI.

## 5. Regole di lavoro (in CLAUDE.md del repo)
Lavoro su main, nessun branch, NESSUN commit da parte degli agenti: modifiche unstaged, review e commit manuali di Ion. DESIGN_SYSTEM.md e ARCHITECTURE.md sono legge; deviazioni segnalate prima di procedere. Dati normativi solo con fonte; valore senza fonte = null + TODO-VERIFY. Motore coperto da test prima di ogni feature sopra. Codice/commenti inglese, testi UI in locales/it.json. Niente AI/LLM nel prodotto.

## 6. Mappa file del repo
- CLAUDE.md — regole di lavoro per Claude Code
- ARCHITECTURE.md — stack, route, schema DB, spec motore/checker/pricing
- DESIGN_SYSTEM.md — palette, font (Archivo/Instrument Sans/IBM Plex Mono), sigillo, 14 principi UX
- CLAUDE_CODE_KICKOFF.md — prompt 4/5/6 ancora da eseguire, con modello assegnato
- STATO_PROGETTO.md — questo file
- docs/ricerca-regole-epr.md — ricerca normativa con fonti + le 10 incertezze
- rules/de.yaml, fr.yaml, it.yaml — regole normative, status: draft, TODO-VERIFY intatti
- lib/engine/ — motore puro + test · lib/checker/ — logica checker + test · lib/email/checker-report.ts — email report · lib/analytics/capture.ts — PostHog safe no-op
- components/checker/* , components/seal.tsx , components/site-footer.tsx
- app/check , app/check/risultato , app/api/leads , app/privacy — fatti; app/(landing) e app/app/* — placeholder
- supabase/migrations/0001_init.sql — applicata · scripts/validate-rules.ts — validazione+seed
- export Claude Design (4 schermate .dc.html) — riferimento visivo

## 7. Problemi aperti / backlog
- Rifiniture UI checker: piccoli errori di posizionamento notati da Ion nel primo test (lista dettagliata da compilare) → giro di polish dedicato dopo PROMPT 5
- Script seed non carica .env.local da solo (workaround: passare le env inline) → fix futuro
- 7 vulnerabilità npm preesistenti segnalate da npm audit → da rivedere prima del deploy
- Resend: passare a dominio verificato prima del lancio
- Verifica umana n.1 (la più urgente): stato proposta COM/2025/982 → determina il messaging sul rappresentante autorizzato in tutti e 3 i paesi
- Nome definitivo + dominio da decidere prima della landing pubblica

## 8. Prossimi step (in ordine)
1. Commit del lavoro PROMPT 3 (se non già fatto)
2. PROMPT 4 landing — Opus 4.8 (testo nel kickoff; riferimento: mockup hero)
3. PROMPT 5 app autenticata — Opus 4.8 (riferimento: mockup dashboard)
4. Giro rifinitura UI (lista di Ion) — Fable 5 se ancora disponibile (finestra: ~5 giorni dal 08/07), altrimenti Opus
5. PROMPT 6 Stripe + legali — Sonnet 4.6
6. Deploy Vercel + dominio + Resend verificato
7. Verifiche umane 10 incertezze → YAML a status: verified
8. Post checker nei gruppi FBA Italia → validazione reale (soglia: 20+ email qualificate in 2 settimane)

## 9. Contesto modelli
Fable 5 disponibile ancora ~5 giorni (dal 08/07/2026). Già usato per: fondamenta, motore, checker. Da riservare a: giro di rifinitura UI e qualsiasi decisione normativa/di prodotto complessa. Opus 4.8 per lavoro strutturale (landing, app), Sonnet 4.6 per meccanica (Stripe, legali, fix).
