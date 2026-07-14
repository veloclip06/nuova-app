# PROMPTS_RIFINITURA_UI.md — Giro di rifinitura UI/UX, una pagina alla volta

Preparato il 11/07/2026. Ogni sezione qui sotto è un prompt autonomo da dare a un agente
in una chat nuova, **una pagina per volta**.

**Come si usa:**
1. Copia il **BLOCCO COMUNE** e incollalo in testa al prompt della pagina scelta.
2. Copia il prompt della pagina subito sotto.
3. Una pagina per chat. Ordine consigliato (funnel prima): Landing → /check → /check/risultato
   → /prezzi → Auth → /onboarding → /app → /app/paesi → /app/prodotti → /app/report
   → /app/piano → /app/impostazioni → Giro trasversale (ultimo, fa da rete di coerenza).
4. Dopo ogni prompt: review del diff, test manuale della pagina, poi commit tuo.

---

## BLOCCO COMUNE (incollare in testa a ogni prompt)

```
Sei un product designer senior con forti competenze front-end. Il tuo compito è alzare di
livello UNA sola pagina di questa web app: rifinire UI, UX e soprattutto le parole, senza
stravolgere ciò che funziona. La struttura e il look generale piacciono e restano: lavori
di dettaglio, non di redesign.

PRIMA DI TOCCARE CODICE, leggi nell'ordine:
1. DESIGN_SYSTEM.md — è LEGGE (token, tipografia, sigillo, motion, principi UX, voce del copy)
2. ARCHITECTURE.md — mappa route e spec (non toccare nulla di ciò che descrive lato dati)
3. STATO_PROGETTO.md sezione 4 — decisioni ratificate: dove confliggono col mockup, vincono loro
4. CLAUDE.md — regole di lavoro
5. La pagina target dal vivo: `npm run dev` e guardala davvero, desktop e 360px, prima di decidere cosa migliorare

COS'È IL PRODOTTO (per calibrare ogni parola):
Cockpit self-serve per venditori e-commerce piccoli (1–10 persone) che vendono in più paesi UE
e devono rispettare gli obblighi EPR sugli imballaggi (registri nazionali, dichiarazioni,
scadenze). Arrivano ansiosi e confusi dalla burocrazia multi-paese; ogni schermata deve
trasformare incertezza in azione concreta. Personalità: "torre di controllo", non startup
giocosa — serio, calmo, preciso, mondo visivo dei registri ufficiali e dei timbri reinterpretato
in digitale. Funnel: checker gratuito (/check) come lead magnet → abbonamento annuale
(Essenziale 149€ / Completo 249€). Zero AI nel prodotto, zero dark pattern, fiducia sopra tutto.

REGOLE NON NEGOZIABILI:
- SOLO front-end: puoi toccare components/, le pagine in app/, locales/it.json e (con cautela)
  globals.css. NON toccare: lib/engine, lib/checker (logica), /rules, API route, migrations,
  middleware, logica auth/Stripe/analytics. Nessuna dipendenza nuova.
- DESIGN_SYSTEM.md non si CAMBIA, ma si può ARRICCHIRE: micro-dettagli coerenti col sistema
  sono benvenuti (etichette in maiuscoletto stile registro, dettagli in Plex Mono dove ci sono
  numeri/codici, bordi e divisori 1px, spaziature più ritmiche, micro-stati già ratificati in §7).
  Se un miglioramento richiede una vera deviazione dal sistema: FERMATI e segnalala nel report
  finale invece di applicarla.
- LE PAROLE SONO DESIGN (§9): questa è la parte più importante del lavoro. Molti titoli e
  descrizioni attuali sono corretti ma piatti. Riscrivili perché parlino al venditore ansioso:
  chiari, diretti, competenti, concreti. Mai burocratese, mai marketing gonfiato, sentence case,
  niente esclamativi. Ogni titolo/sottotitolo deve guadagnarsi il posto: se non aggiunge
  informazione o non riduce ansia, va riscritto o rimosso. Tutti i testi UI vivono in
  locales/it.json — mai stringhe hardcoded nei componenti. Codice e commenti in inglese.
- MAI INVENTARE DATI NORMATIVI: puoi riformulare e riorganizzare testi normativi esistenti
  (senza cambiarne il significato), ma non puoi aggiungere fatti normativi nuovi (cifre, date,
  soglie, nomi di registri) che non siano già in it.json o in /rules con fonte. Se il copy
  migliore richiederebbe un dato che non c'è: usa una formulazione generica o segnala.
- NEUTRALITÀ TRA PAESI (decisione ratificata 10/07/2026): nessun paese UE ha rilievo visivo o
  verbale speciale nella UI generica. Il prodotto copre l'intera UE; la copertura dettagliata
  di oggi (derivata a runtime da /rules) è un DATO comunicato con microcopy onesta, non
  un'identità del prodotto. Contenuti specifici per paese vanno bene SOLO quando derivano dalla
  selezione dell'utente o da dati normativi mostrati con fonte. Esempi concreti nel copy
  (con fonte) sono ammessi ma devono leggersi come esempi di un sistema a 27 paesi, mai come
  "il prodotto serve per questi 3 paesi". L'onestà sulla copertura NON si rimuove mai.
- Vincoli UI ratificati: max 1 CTA primaria per schermata (le altre ghost/outline). Sigillo a
  4 stati: CONFORME (ok) / AZIONE RICHIESTA (warn) / ESPOSTO (risk) / NON OBBLIGATO (neutro,
  mai verde). risk e warn solo semantici, mai decorativi. Motion budget minimo: la rivelazione
  del risultato del checker è l'unico momento orchestrato; per il resto solo i micro-stati di
  DESIGN_SYSTEM §7. Fonte + data su ogni dato normativo mostrato; finché i rules sono draft si
  mostra "consultata il {data}" + badge "in verifica", mai "verificato il".
- Pavimento di qualità (§10): responsive fino a 360px, focus visibile, contrasto AA,
  prefers-reduced-motion, stati loading/error/empty. Se cambi il layout di una vista dati,
  aggiorna il relativo loading.tsx/skeleton perché continui a rispecchiarlo.

PERIMETRO E CONSEGNA:
- Lavora SOLO sulla pagina indicata sotto e sulle sue chiavi in it.json. Se devi toccare un
  componente condiviso (header, footer, Seal, OptionCard, PricingSection…), fallo solo se il
  cambiamento migliora anche le altre pagine che lo usano, e dichiaralo nel report.
- Lavora su main, nessun branch, NESSUN commit: lascia tutto unstaged.
- A fine lavoro: `npm run lint`, `npm run typecheck`, `npm run test` (145 test: devono restare
  verdi — se un test copre un testo che hai cambiato, aggiorna il test), `npm run build`.
- Report finale in chat: elenco puntato dei cambiamenti (UI e copy separati), i copy cambiati
  in formato prima → dopo, eventuali deviazioni proposte e NON applicate, eventuali impatti su
  componenti condivisi. Non aggiornare STATO_PROGETTO.md (il giro di rifinitura viene loggato a
  fine giro), a meno che tu non scopra un problema nuovo: in quel caso una sola riga in sezione 7.
```

---

## 1. Landing `/` — ✅ eseguito (11/07/2026, Fable 5)

```
PAGINA TARGET: la landing pubblica `/` — app/page.tsx e components/landing/*
(hero.tsx, hero-preview.tsx, pain.tsx, how-it-works.tsx, pricing.tsx, faq.tsx), più
components/site-header.tsx e site-footer.tsx dove servono. Testi in locales/it.json → "landing",
"meta.home". Riferimento visivo: export "03 Landing hero.dc.html" (la struttura è già fedele).

RUOLO DELLA PAGINA: primo contatto. Un venditore arriva scettico e di fretta; in 5 secondi deve
capire cosa fa il prodotto, sentirsi capito nel suo problema e cliccare "Fai il check gratuito"
(unica CTA primaria). È anche la pagina che oggi soffre di più del problema di neutralità paesi.

COSA MIGLIORARE (analizza tu, ma questi punti sono noti):
1. NEUTRALITÀ — è il difetto principale della pagina:
   - hero-preview.tsx mostra "i primi 3 paesi coperti", che oggi sono sempre gli stessi tre:
     l'anteprima si legge come "il prodotto serve per questi 3 paesi". Ripensala perché comunichi
     un sistema che copre l'UE intera (l'anteprima è decorativa e aria-hidden: hai libertà
     creativa, purché non menta sulla copertura reale e non privilegi nessun paese specifico).
   - pain.tsx: le 3 storie di dolore sono tutte incardinate su tre paesi specifici fin dai
     titoli. I fatti con fonte restano (sono veri e fanno fiducia), ma la cornice va ribaltata:
     il dolore è che OGNI paese UE ha il suo registro, la sua lingua, il suo calendario — i casi
     citati devono leggersi come esempi, non come il perimetro del prodotto.
   - faq.tsx / landing.faq: domande come "Quanto costa registrarsi in Germania, Francia e
     Italia?" incorniciano il prodotto su 3 paesi. Riformula le domande in chiave UE
     ("Quanto costa registrarsi? Dipende dal paese — esempi con fonte: …") mantenendo intatti
     i fatti normativi esistenti e le loro fonti. Non aggiungere fatti nuovi per altri paesi.
   - meta.home.description è costruita sui nomi dei registri dei paesi coperti: rendila
     UE-neutra mantenendo onestà su cosa fa il prodotto.
2. COPY: il titolo hero funziona ma può essere più affilato; il sottotitolo è generico.
   Le tagline dei tier ("Il meglio che possiamo offrire.") sono deboli — vedi anche prompt
   /prezzi, PricingSection è condivisa. Rileggi ogni eyebrow/titolo/body della pagina con la
   domanda: "questo riduce l'ansia o è riempitivo?".
3. UI: ritmo verticale tra le sezioni, gerarchia tipografica dei body lunghi (pain e FAQ hanno
   paragrafi densi), cura dei dettagli "da registro" (mono per numeri e date, etichette
   maiuscoletto) dove già ci sono numeri. La preview nel hero è l'occasione per mostrare la
   firma visiva (sigillo) al meglio.

NON TOCCARE: la logica coverage (lib/rules/coverage.ts) — la usi, non la modifichi; lo schema
FAQPage/SEO se non per riflettere i testi nuovi; l'ancoraggio CTA → /check.
```

---

## 2. `/prezzi`

```
PAGINA TARGET: app/prezzi/page.tsx + components/landing/pricing.tsx (PricingSection, condivisa
con la landing: ogni modifica vale per entrambe — dichiaralo nel report). Testi in it.json →
"landing.pricing", "meta.prezzi".

RUOLO DELLA PAGINA: chi arriva qui sta valutando se fidarsi e pagare 149–249€/anno. Deve uscire
con zero domande aperte su cosa include cosa. Pricing ratificato (ARCHITECTURE §8, non si
discute): solo annuale, 2 piani — Essenziale 149€ (fino a 3 paesi) e Completo 249€ (tutti i
paesi anche futuri, CSV, storico), Completo evidenziato; il checker gratuito NON è un piano, è
una striscia sotto la griglia che linka /check; "IVA esclusa · rimborso 30 giorni"; nessuna
telefonata/contatto commerciale (è un punto di forza: dillo bene).

COSA MIGLIORARE:
1. COPY: le tagline dei tier sono il punto debole ("Per chi vende in pochi mercati." /
   "Il meglio che possiamo offrire." — la seconda non dice nulla). Ogni tagline deve dire A CHI
   serve quel piano in termini concreti. Rivedi anche l'ordine e la formulazione delle feature:
   "Tutto ciò che c'è in Essenziale" di solito apre la lista, non la chiude; ogni voce deve
   essere un beneficio verificabile, non una spec. La striscia checker può lavorare di più come
   de-risking ("prova gratis prima di decidere").
2. UI: la pagina /prezzi è oggi un involucro sottile attorno alla sezione condivisa — valuta se
   merita un'intestazione propria che risponda alle obiezioni (rimborso, niente vincoli,
   disdetta dal portale) senza duplicare la FAQ della landing.
3. NEUTRALITÀ: "Fino a 3 paesi" e "Tutti i paesi coperti" vanno bene (sono piani, non paesi
   specifici) — verifica solo che nessun esempio citi paesi a caso.

NON TOCCARE: prezzi, nomi dei piani, cosa include ciascun piano, gli href delle CTA
(→ /registrati: ratificato, l'acquisto avviene da /app/piano dopo la registrazione).
```

---

## 3. `/check` (wizard)

```
PAGINA TARGET: app/check/page.tsx + components/checker/checker-wizard.tsx, option-card.tsx,
progress-header.tsx, flag.tsx. Testi in it.json → "check.steps", "check.options", "meta.check".
Riferimento visivo: export "02 Checker passo 2.dc.html".

RUOLO DELLA PAGINA: il lead magnet. Nessun login, una domanda per schermata, 5 step, barra di
progresso. Chi entra è curioso ma diffidente: ogni step deve sembrare veloce, professionale e
"già a metà". L'abbandono per step è tracciato in PostHog: ogni attrito qui costa lead.

VINCOLI SPECIFICI GIÀ RATIFICATI (non regredire):
- Step 2 = griglia UNIFORME dei 27 paesi UE, nessun paese evidenziato o più grande. La
  copertura dettagliata è comunicata solo nel microcopy sotto la griglia; i paesi non coperti
  raccolgono interesse. Questo resta esattamente così come principio: puoi migliorare la RESA
  (densità della griglia, stati selected/hover, leggibilità delle bandiere piccole, il contatore
  "N paesi selezionati"), non la logica.
- Una domanda per schermata, risposte in stato locale, focus sul titolo al cambio step.

COSA MIGLIORARE:
1. COPY: i titoli delle domande sono funzionali ma il tono può essere più da "operatore che ti
   guida" (gli help sotto i titoli sono già buoni: portali tutti a quel livello). Il microcopy
   di copertura allo step 2 è onesto ma elenca i paesi coperti come una lista a secco — deve
   restare onesto senza suonare come "il prodotto è solo questi": lavora sulla formulazione,
   non sulla sostanza. Etichette CTA: "Continua" / "Vedi il risultato" — verifica che l'ultimo
   step prometta bene il valore (§9: verbi specifici).
2. UX: step 1 usa una select nativa per 27+1 opzioni — valuta se la resa è all'altezza (resta
   semplice: niente librerie nuove). Step 5 (fasce volume per paese) è il più denso: cura
   l'allineamento delle pill, il caso "molti paesi selezionati", e il fatto che "Non lo so" sia
   un'opzione legittima e visibile (riduce abbandono). Stati disabled del bottone Continua:
   chiaro perché non si può proseguire?
3. UI: la barra di progresso è il "progresso dotato" (§8.2) — verifica che dia davvero la
   sensazione di avanzamento; micro-dettagli da registro (numero passo in mono, eyebrow).

NON TOCCARE: lib/checker/options.ts e params.ts (logica), gli eventi PostHog per step, la
struttura a 5 step, l'ordine delle domande.
```

---

## 4. `/check/risultato`

```
PAGINA TARGET: app/check/risultato/page.tsx + components/checker/result-card.tsx,
email-gate.tsx, uncertain-badge.tsx, result-tracker.tsx (solo resa), components/seal.tsx (con
cautela: condiviso ovunque). Testi in it.json → "check.result", "check.email*". Riferimento
visivo: export "01 Risultato checker.dc.html".

RUOLO DELLA PAGINA: IL PICCO del prodotto (regola picco-fine, DESIGN_SYSTEM §8.11): è la
schermata per cui esiste il funnel. L'utente scopre se è esposto; deve sentire che la risposta
è seria, documentata e azionabile — e lasciare l'email per il report completo. Massima cura.

VINCOLI SPECIFICI GIÀ RATIFICATI (non regredire):
- Sigillo = stato legale (4 stati; NON OBBLIGATO mai verde). Le righe di rischio nella card
  seguono riskLevel: high → riga delisting; medium → solo sanzioni con fonte; dato incerto →
  badge "in verifica", MAI claim di blocco. Caso domestico → copy dedicato.
- Microcopy sotto il titolo: risultato calcolato assumendo utente non ancora registrato.
- CTA: primaria = email gate; secondaria outline = registrazione. Solo queste due.
- Rivelazione: le card entrano in sequenza con 80ms di stagger — è l'UNICO momento motion
  orchestrato del prodotto: se lo ritocchi, che sia per renderlo più "stampigliatura", non di più.
- Fonte + "consultata il {data}" + badge "in verifica" su ogni dato normativo (rules draft).

COSA MIGLIORARE:
1. GERARCHIA: dentro la card-paese l'occhio deve andare: sigillo → cosa significa per me →
   cosa rischio (con fonte) → cosa fare. I blocchi sul rappresentante autorizzato (check.result.ar)
   sono paragrafi normativi lunghi e densi: NON riscriverne la sostanza (è normativa verificata,
   ogni parola pesa) ma cura la resa tipografica perché siano scansionabili invece che un muro
   di testo.
2. EMAIL GATE: è la conversione. Il titolo/sottotitolo attuali sono corretti ma non fanno
   percepire il valore del report (checklist paese per paese, fonti, cosa fare in ordine).
   Stati invio/successo/errore già testuali: verificane il tono. La reassurance "solo il report,
   niente spam" è giusta: valorizzala.
3. COPY: le summary ("Sei esposto in N paesi su M") sono buone. Verifica il caso
   "summaryNoneCovered" e "notCoveredNote": onesti ma devono anche dire cosa succede dopo
   (interesse registrato, priorità) senza promettere date.
4. NEUTRALITÀ: qui i paesi mostrati derivano dalla selezione dell'utente: va bene. Verifica solo
   che nessun elemento decorativo reintroduca un ordine "preferito" di paesi.

NON TOCCARE: il ricalcolo server-side, /api/leads, la logica lead-fallback, noindex/canonical
(deviazione ratificata), la semantica del sigillo e delle righe di rischio.
```

---

## 5. Auth: `/login`, `/registrati`, `/reset-password`

```
PAGINA TARGET: app/login, app/registrati, app/reset-password + components/auth/* (auth-shell,
auth-parts, login-form, signup-form, reset-password-form, google-button). Testi in it.json →
"app.auth". Le tre pagine condividono la shell: trattale come un unico sistema coerente.

RUOLO DELLE PAGINE: cerniera tra il checker gratuito e l'app. Chi si registra spesso arriva
dal risultato del checker con l'ansia ancora addosso: la registrazione deve sembrare il primo
passo della soluzione, non un modulo. Fiducia: dati in UE, niente spam, si può uscire quando
si vuole — senza trasformare la pagina in un volantino.

COSA MIGLIORARE:
1. COPY: i sottotitoli attuali sono riempitivi ("Entra nel tuo cruscotto EPR." /
   "Gestisci gli obblighi EPR paese per paese."). Riscrivili perché continuino il filo del
   funnel (es. la registrazione trasforma il risultato del check in un piano d'azione).
   Il flusso reset ha già il pattern giusto ("Se esiste un account per…"): allinea tutto a quel
   livello di precisione. Errori: già specifici, verifica il tono §9.
2. UI: le pagine auth sono spesso le più anonime di un prodotto — qui possono avere carattere
   "torre di controllo" con pochissimo (eyebrow da registro, cura dei campi, focus states,
   il divisore "oppure" col bottone Google). Niente illustrazioni, niente decorazione gratuita.
3. UX: stato "confirmTitle/confirmBody" post-registrazione (controlla la tua email): è un punto
   dove si perdono utenti — rendi chiarissimo cosa fare e cosa aspettarsi. Link incrociati
   login↔registrati↔reset sempre visibili ma secondari.

NON TOCCARE: la logica Supabase (azioni, redirect, middleware), il flusso Google OAuth, i
requisiti password.
```

---

## 6. `/onboarding`

```
PAGINA TARGET: app/onboarding/page.tsx + components/app/onboarding-wizard.tsx. Testi in
it.json → "app.onboarding".

RUOLO DELLA PAGINA: primo minuto dentro il prodotto dopo la registrazione: azienda → paesi di
vendita → stato per paese, poi cruscotto. Deve dare la sensazione di "sto già configurando il
mio quadro", non di un altro form. Tre step, progresso visibile.

VINCOLI SPECIFICI GIÀ RATIFICATI (non regredire):
- Griglia paesi UNIFORME dei 27 (identico principio del checker step 2): nessun paese
  evidenziato; copertura = microcopy onesto; i non coperti si selezionano comunque e vengono
  registrati come interesse.
- Cap piani: massimo 3 paesi COPERTI selezionabili anche per free (i paesi-interesse sono
  illimitati). Il limitNotice e errorLimit esistono già: migliorane la formulazione, non la
  logica.
- Caso "vende solo in paesi non coperti": esiste il copy noneCovered — è anche un punto aperto
  in STATO_PROGETTO §7 (empty state dashboard da verificare): cura questo percorso.

COSA MIGLIORARE:
1. COPY: titoli/sottotitoli corretti ma piatti ("Bastano pochi dati per iniziare."). Ogni step
   può dire PERCHÉ chiede quel dato (lo step 1 lo fa già con countryHelp: quel livello ovunque).
   Lo step 3 (stato per paese) è concettualmente il più nuovo per l'utente: spiega che lo stato
   determina il sigillo e che si può aggiornare dopo.
2. UX: il passaggio finale "Vai al cruscotto" è il momento in cui l'endowed progress si incassa:
   verifica che l'ultimo step non sembri un vicolo cieco quando nessun paese è coperto.
3. UI: coerenza con il checker (è lo stesso pattern wizard): progress, focus al cambio step,
   griglia, contatore selezione.

NON TOCCARE: app/onboarding/actions.ts (logica), il cap 3 paesi, l'evento
onboarding_interest_countries, l'ordine degli step.
```

---

## 7. `/app` (dashboard)

```
PAGINA TARGET: app/app/page.tsx + components/app/country-card.tsx, deadlines-list.tsx,
page-header.tsx, app-shell.tsx e app-main.tsx (con cautela: condivisi da tutta l'app), più
app/app/loading.tsx (lo skeleton deve continuare a rispecchiare il layout). Testi in it.json →
"app.dashboard". Riferimento visivo: export "04 Dashboard.dc.html".

RUOLO DELLA PAGINA: la "torre di controllo" quotidiana. In un colpo d'occhio: sono a posto?
dove no? qual è la prossima cosa da fare? Banner di progresso configurazione con l'azione
mancante cliccabile, card-paese con sigillo, prossime scadenze.

VINCOLI SPECIFICI GIÀ RATIFICATI (non regredire):
- Sigillo in app: registered → CONFORME, in_progress → AZIONE RICHIESTA, not_registered
  obbligato → ESPOSTO (estero) / AZIONE RICHIESTA (domestico), non obbligato → NON OBBLIGATO.
- UNICA azione primaria della schermata = il link del banner "Completa {Paese}". Le azioni
  sulle card sono ghost/outline.
- Card-paese (DESIGN_SYSTEM §6): bandiera piccola + nome registro + sigillo + prossima
  scadenza + UNA sola azione.
- Sui rules draft il sigillo rende lo stato "in verifica" — mai dati finti.

COSA MIGLIORARE:
1. COPY: eyebrow e titolo oggi sono identici ("Quadro generale" due volte) — il titolo deve
   lavorare di più. Le etichette delle scadenze ("Scoperto", "Da preparare", "In regola",
   "Informativo") e gli stati card sono asciutti: verifica che siano immediatamente
   comprensibili per un non addetto. L'empty state c'è già ed è nel pattern giusto (§8.10):
   controlla che copra bene anche il caso "solo paesi non coperti" (punto aperto in
   STATO_PROGETTO §7).
2. UI: la dashboard è la schermata dove il sigillo — la firma visiva — deve rendere al massimo:
   gerarchia della card (registro in maiuscoletto, scadenza in mono, sigillo protagonista),
   ritmo della griglia, lista scadenze con date in Plex Mono. Banner progresso: il "pezzo
   mancante cliccabile" deve essere evidente senza essere un alert.
3. UX: con 1 paese, con 3, con paesi non configurati, con nessuna scadenza datata: guarda la
   pagina in tutti questi stati e cura i casi intermedi.

NON TOCCARE: lib/app/* (mappers, seal, deadlines-sync), le query, la semantica del sigillo.
```

---

## 8. `/app/paesi` + `/app/paesi/[code]`

```
PAGINA TARGET: app/app/paesi/page.tsx e app/app/paesi/[code]/page.tsx + components/app/
country-card.tsx (condivisa con la dashboard: dichiara gli impatti), status-changer.tsx, e i
relativi loading.tsx. Testi in it.json → "app.paesi", "app.country".

RUOLO DELLE PAGINE: la lista è una vista d'insieme; il DETTAGLIO paese è dove l'utente esegue
davvero: cosa serve, dove registrarsi (portale), scadenze, sanzioni, rappresentante autorizzato,
fonti — e aggiorna il proprio stato. È la pagina più "documento ufficiale" del prodotto.

VINCOLI SPECIFICI GIÀ RATIFICATI (non regredire):
- Cambio stato → quando passa a "registered", il sigillo diventa CONFORME con la micro-animazione
  di stampigliatura 300ms (DESIGN_SYSTEM §5): è LA ricompensa emotiva del prodotto. Se oggi il
  momento non rende, è il primo posto dove investire. prefers-reduced-motion rispettato.
- Ogni dato normativo: fonte + "consultata il" + badge "in verifica" (rules draft).
- Feedback salvataggio testuale ("Salvataggio…"), mai spinner.

COSA MIGLIORARE:
1. COPY: "I tuoi paesi / Stato e obblighi per ogni paese in cui vendi." è piatto. Nel dettaglio,
   le etichette delle sezioni (Registro, Cosa serve, Scadenze, Sanzioni, Fonti) funzionano; cura
   i casi vuoti ("Nessuna scadenza datata al momento", notObligated, notCovered) perché dicano
   sempre il perché e il poi. statusHelp è già nel tono giusto.
2. UI: il dettaglio è denso di dati normativi — è l'occasione per l'estetica "registro
   ufficiale": codici e importi in Plex Mono, blocchi con bordi 1px, etichette maiuscoletto,
   sanzioni con il rosso SOLO dove c'è rischio reale (mai decorativo). I paragrafi AR sono muri
   di testo: scansionabilità tipografica senza toccare la sostanza normativa.
3. UX: lo status-changer è l'azione chiave della pagina: deve essere trovabile subito e
   comunicare le conseguenze (il sigillo cambia). La lista /paesi non deve essere una dashboard
   doppione: chiarisci il suo ruolo (inventario completo vs colpo d'occhio).

NON TOCCARE: actions.ts, la logica di sync scadenze, la semantica del sigillo, i testi normativi
nella loro sostanza.
```

---

## 9. `/app/prodotti`

```
PAGINA TARGET: app/app/prodotti/page.tsx + components/app/products-client.tsx, product-form.tsx,
csv-import.tsx + loading.tsx. Testi in it.json → "app.products", "app.materials".

RUOLO DELLA PAGINA: qui l'utente costruisce il dato che alimenta i report: SKU + componenti di
imballaggio (materiale + peso in grammi). È lavoro noioso: la pagina deve renderlo veloce e
a prova di errore. "I numeri sono il prodotto": pesi e codici devono sembrare esatti, da
documento ufficiale (Plex Mono, allineamento a destra per le celle numeriche).

COSA MIGLIORARE:
1. UX del form: aggiunta componente dopo componente deve essere fluida (default intelligenti
   §8.9 dove possibile, validazione inline §8.7, errori già specifici — mantienili così).
   La conferma di eliminazione SKU è l'unica distruttiva: verifica che segua §8.7.
2. UX dell'import CSV (solo piano Completo, gated): il flusso file → mappatura colonne →
   anteprima con righe valide/errori → conferma c'è già ed è solido; cura la leggibilità
   dell'anteprima, la chiarezza degli errori per riga e il momento di successo
   ("{{count}} SKU importati." può incassare meglio il lavoro fatto).
3. UI della tabella: densità professionale (§6), peso unitario e conteggi in mono, colonna
   origine (manuale/CSV) discreta. Empty state già nel pattern giusto: verifica solo che il
   primo passo sia inequivocabile.
4. COPY: titolo/sottotitolo migliorabili; le label di form e import sono già buone e specifiche.

NON TOCCARE: actions.ts, il parser CSV (lib/…, è testato), la tassonomia materiali, il gating
per piano (upgrade-gate).
```

---

## 10. `/app/report`

```
PAGINA TARGET: app/app/report/page.tsx + components/app/report-client.tsx, report-history.tsx
+ loading.tsx. Testi in it.json → "app.report".

RUOLO DELLA PAGINA: LA FINE del percorso (regola picco-fine §8.11, secondo momento di massima
cura): paese + periodo + volumi → numeri pronti da incollare nel portale ufficiale. La
conferma "report generato, pronto da incollare" è la ricompensa per cui l'utente paga:
oggi il risultato appare, ma verifica se il MOMENTO rende quanto deve.

VINCOLI SPECIFICI GIÀ RATIFICATI (non regredire):
- Volumi inseriti inline in questa schermata (nessuna pagina volumi separata — ratificato).
- Tabelle risultato in Plex Mono, per materiale e per categoria registro; copia TSV + export
  CSV; salvataggio nello storico; storico visibile solo per Completo (gated, UI minimale
  ratificata).
- draftNotice sul risultato ("controlla i valori prima di dichiararli") — resta: è onestà.
- Errori di generazione: già specifici per SKU (ottimi, §9) — non degradarli.

COSA MIGLIORARE:
1. IL MOMENTO DEL RISULTATO: quando il report è pronto, la gerarchia deve celebrare senza
   coriandoli (siamo una torre di controllo): titolo "Report {registro} · {periodo}" in
   evidenza, azioni copia/esporta immediate, feedback "Copiato negli appunti." ben visibile.
   Valuta micro-feedback coerenti col §7 (niente motion nuovo oltre budget).
2. UX del flusso: selezione paese/periodo → volumi → genera: lo stato "selectPrompt" e il caso
   noProducts (con CTA ai prodotti) esistono; cura la transizione tra gli stati e il caso
   "Ricalcola" dopo una modifica volumi.
3. UI: le due viste (per materiale / per categoria registro) devono essere chiaramente due
   letture dello stesso dato; celle numeriche mono allineate a destra; il periodo in mono.
4. COPY: sottotitolo già decente; verifica che ogni etichetta usi il nome del registro reale
   del paese selezionato dove disponibile (dai dati, non hardcoded).

NON TOCCARE: actions.ts, computeReport e il motore, il formato TSV/CSV, il gating dello storico,
la logica di salvataggio in reports.
```

---

## 11. `/app/piano`

```
PAGINA TARGET: app/app/piano/page.tsx + components/app/piano-client.tsx, upgrade-gate.tsx
(condiviso: appare anche in report/prodotti — dichiara gli impatti) + loading.tsx. Testi in
it.json → "app.plan".

RUOLO DELLA PAGINA: qui il free diventa pagante (checkout post-registrazione, ratificato) e
l'abbonato gestisce il piano (Stripe Customer Portal). Deve essere coerente con /prezzi
(stessi piani, stessi benefici, stesse parole) e onesta: niente pressure, il rimborso 30 giorni
e la disdetta facile sono argomenti, non postille.

COSA MIGLIORARE:
1. COERENZA: confronta questa pagina con PricingSection della landing — nomi feature, tagline e
   ordine devono raccontare la stessa storia (se hai già rifinito /prezzi, allineati a quello).
2. COPY: freeBanner è già buono ("…si sbloccano con un piano"); i gate (report/csv/storico)
   hanno il pattern giusto titolo+beneficio+CTA — rifinisci perché ogni gate venda il beneficio
   concreto, non la feature. Stati success/cancelled/error del checkout: tono calmo, mai colpa
   all'utente.
3. UI: badge "Piano attuale", gerarchia tra i due piani (Completo evidenziato come su /prezzi),
   blocco portale Stripe separato e sobrio. Max 1 CTA primaria: decidi quale (upgrade per i
   free; portale per gli abbonati) e tieni il resto outline.

NON TOCCARE: actions.ts, lib/plans.ts, lib/stripe/*, gli eventi analytics (upgrade_viewed,
checkout_started…), la logica di gating.
```

---

## 12. `/app/impostazioni`

```
PAGINA TARGET: app/app/impostazioni/page.tsx + components/app/settings-form.tsx + loading.tsx.
Testi in it.json → "app.settings".

RUOLO DELLA PAGINA: pagina di servizio (dati azienda, account, rimando al piano). Deve essere
impeccabile e noiosa nel senso buono: tutto trovabile, niente sorprese.

COSA MIGLIORARE:
1. COPY: eyebrow e titolo oggi identici ("Impostazioni" due volte): differenzia. planBody è
   funzionale; verifica che il rimando alla pagina Piano sia chiaro.
2. UI: raggruppamento in sezioni con bordi 1px ed etichette da registro; feedback salvataggio
   testuale già a norma (§7) — verifica la posizione (visibile senza spostare lo sguardo).
3. UX: il cambio "Paese di stabilimento" ha conseguenze sugli obblighi (domestico vs estero):
   se la UI non lo dice, aggiungi un help onesto SENZA inventare dettagli normativi. "Esci" non
   deve sembrare un'azione distruttiva accanto al salvataggio.

NON TOCCARE: actions.ts, la logica di aggiornamento company, l'auth.
```

---

## 13. Giro trasversale di coerenza — ✅ eseguito (14/07/2026, Opus 4.8)

```
PAGINA TARGET: gli elementi condivisi e le pagine minori — components/site-header.tsx,
site-footer.tsx, app-shell.tsx (sidebar/nav), app/not-found.tsx, app/app/error.tsx,
components/cookie-banner.tsx, app/privacy/page.tsx e app/termini/page.tsx (solo resa
tipografica: i testi legali NON si riscrivono), più una passata di coerenza su tutto.

RUOLO DEL GIRO: dopo le rifiniture pagina-per-pagina, questo giro chiude: stessa voce, stessi
pattern, stessi dettagli ovunque. Non introduce novità: uniforma.

COSA FARE:
1. AUDIT DI COERENZA (prima di toccare qualsiasi cosa, produci l'elenco): eyebrow/maiuscoletto
   usati allo stesso modo su ogni pagina; date, numeri e codici SEMPRE in Plex Mono; stessa
   scala spaziature tra header di pagina e contenuto; empty/error/loading state con lo stesso
   pattern; una sola CTA primaria per schermata OVUNQUE; sentence case e zero esclamativi in
   tutto it.json; nomi delle azioni identici lungo tutto il flusso (§9: se si chiama "Genera
   report" da una parte, si chiama così ovunque).
2. NEUTRALITÀ PAESI — verifica finale su tutto il front-end: cerca ogni punto dove un paese
   specifico è nominato o mostrato fuori da (a) dati normativi con fonte, (b) contenuto derivato
   dalla selezione dell'utente, (c) microcopy onesto di copertura. Tutto il resto va
   neutralizzato. Includi metadata, OG image e sitemap nella verifica (solo resa/testi).
3. HEADER/FOOTER/NAV: il footer porta il disclaimer fisso ("Software di supporto alla
   conformità. Non costituisce consulenza legale.") — intoccabile nel testo, curabile nella
   resa. Nav: etichette, stati attivi, ordine coerente con l'informazione reale delle pagine.
4. PAGINE MINORI: 404 e error con lo stesso carattere del prodotto (calme, utili, un'azione);
   cookie banner sobrio e conforme (testo consent già ok); privacy/termini: solo gerarchia
   tipografica e leggibilità, testo INTATTO.
5. A fine giro, riporta in chat un elenco "fuori scope" di tutto ciò che meriterebbe lavoro ma
   esce dal perimetro front-end (lo valuterà Ion).
```
