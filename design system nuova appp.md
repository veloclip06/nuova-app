# DESIGN_SYSTEM.md — Cockpit EPR
Questo documento è legge per ogni schermata. Claude Code non deve deviare senza segnalarlo esplicitamente.

## 1. Identità del prodotto
- **Cos'è:** un cruscotto self-serve che trasforma il caos degli obblighi EPR multi-paese in una risposta chiara: "sei a posto / sei esposto, ed ecco cosa fare".
- **Per chi:** venditori e-commerce 1–10 persone, non esperti di normative, stressati dalla burocrazia. Arrivano ansiosi, devono uscire con il controllo della situazione.
- **Il lavoro di ogni schermata:** ridurre ansia trasformando incertezza in azione concreta. Mai aggiungere rumore.

## 2. Personalità visiva
**"Torre di controllo", non "startup giocosa".** Serio, calmo, preciso, istituzionale-moderno. Il mondo visivo di riferimento è quello di registri ufficiali, codici doganali, timbri, etichette di spedizione — reinterpretato in chiave pulita e digitale.

Esplicitamente vietato:
- Estetica eco-cliché (foglioline, pianeti verdi, mani che reggono germogli)
- Gradient viola/rosa da SaaS generico, sparkle/stelline AI, emoji nell'interfaccia
- Sfondo crema caldo + serif + accento terracotta (look AI-generato riconoscibile)
- Dark mode come default (i dati di compliance si leggono meglio su chiaro; dark mode opzionale post-MVP)

## 3. Palette (token)
| Token | Hex | Uso |
|---|---|---|
| `ink` | #17242F | Testo primario, superfici scure (header risultato) |
| `paper` | #F7F8F6 | Sfondo app (bianco freddo, non crema) |
| `surface` | #FFFFFF | Card, tabelle |
| `line` | #DEE3E0 | Bordi 1px, divisori |
| `brand` | #0E6B5C | Verde-teal profondo "registro": CTA, link, focus. Ponte tra fiducia (blu) e ambito ambientale (verde) senza cliché eco |
| `ok` | #1E7F4F | Stato conforme |
| `warn` | #B45309 | Scadenza vicina, dati incompleti |
| `risk` | #B3261E | Obbligo scoperto, rischio sanzione. SOLO per rischio reale, mai decorativo |

Regola: `risk` e `warn` sono semantici. Se tutto è urgente, niente è urgente.

## 4. Tipografia
- **Display (titoli):** `Archivo` — pesi 600–700, tracking leggermente negativo sui titoli grandi. Nei label di sezione/eyebrow: Archivo 600, maiuscoletto, letter-spacing +0.08em (effetto "intestazione di registro").
- **Body:** `Instrument Sans` — 400/500, 16px base, line-height 1.6.
- **Dati e codici:** `IBM Plex Mono` — numeri di registrazione, pesi in grammi, codici materiale, scadenze. I numeri sono il prodotto: devono sembrare esatti, da documento ufficiale.
- Scala: 13 / 15 / 16 / 20 / 25 / 31 / 39 / 49.

## 5. Firma visiva (l'elemento memorabile)
**Il sigillo di stato.** Ogni paese nel dashboard e nel risultato del checker ha un marchio a forma di timbro/sigillo circolare o rettangolare con bordo doppio: `CONFORME` (ok), `AZIONE RICHIESTA` (warn), `ESPOSTO` (risk), `NON OBBLIGATO` (neutro: bordo `line`, testo `ink` — è uno stato informativo "non si applica", non uno stato di conformità: mai usare il verde `ok` qui). Data ed etichette del sigillo in Plex Mono. È l'unico elemento "audace": tutto il resto resta quieto e disciplinato. Il momento in cui il sigillo passa a CONFORME è la ricompensa emotiva del prodotto (micro-animazione di stampigliatura, 300ms, rispetta `prefers-reduced-motion`).

## 6. Layout e componenti
- Base shadcn/ui, personalizzata con i token sopra. Radius 8px, bordi 1px `line`, ombre quasi assenti (solo hover su card interattive).
- Densità: comoda ma professionale. Tabelle per SKU e volumi (Plex Mono per le celle numeriche, allineate a destra).
- Card-paese: bandiera piccola + nome registro + sigillo stato + prossima scadenza + una sola azione primaria.
- Max 1 CTA primaria per schermata. Le secondarie sono ghost/outline.

## 7. Motion
Minimale. Un solo momento orchestrato: la rivelazione del risultato del checker (le card-paese entrano in sequenza, 80ms di stagger). Micro-feedback su azioni (i sigilli, i salvataggi). Nient'altro. Troppa animazione = look AI-generato.

**Addendum stati di caricamento e interazione (approvato da Ion in chat, 2026-07-10):**
- **Skeleton di caricamento**: durante il fetch di una vista dati si mostra uno skeleton che rispecchia il layout reale (bordi e superfici veri, righe interne pulsanti). Il pulse è solo opacità sul token `line` (`animate-pulse`, componente `ui/skeleton`): è feedback di stato del sistema richiesto dal §10 e dal §8.12, non animazione decorativa — non conta nel budget motion. Congelato da `prefers-reduced-motion`.
- **Feedback di salvataggio**: testuale ("Salvataggio…"), mai spinner. Il testo copre l'intera finestra azione + ri-render.
- **Stati hover ammessi** (solo `transition-colors`, nessun movimento): bordo `ink/25` su input e select; riga tabella `bg-paper`; card interattive con bordo `ink/20` + `shadow-sm` (già previsto dal §6).
- **Pressione bottone**: `active:translate-y-px` — 1px fisico, carattere "timbro". È un cambio di stato istantaneo, non un'animazione.

## 8. Principi UX applicati (con dove si applicano)
1. **Carico cognitivo minimo** — checker: una domanda per schermata, mai form lunghi. Nell'app: una decisione per vista.
2. **Progresso visibile e dotato** (endowed progress) — barra passi nel checker; nel dashboard "2/3 paesi configurati" con il pezzo mancante cliccabile.
3. **Avversione alla perdita, usata onestamente** — il risultato dice cosa rischi (sanzioni reali, delisting Amazon) con cifre vere e fonte linkata. Vietato inventare o gonfiare urgenza.
4. **Legge di Jakob** — il dashboard usa pattern familiari (sidebar, card, tabelle). L'originalità sta nel sigillo e nella tipografia, non nella navigazione.
5. **Legge di Hick** — mai più di 4–5 opzioni per scelta. Pricing: 3 tier, il centrale evidenziato (ancoraggio).
6. **Riconoscere, non ricordare** — l'utente non deve mai ricordare una scadenza o un codice: sono sempre visibili dove servono.
7. **Prevenzione dell'errore** — validazione inline mentre digiti; combinazioni impossibili disabilitate con spiegazione; conferma solo per azioni distruttive.
8. **Divulgazione progressiva** — campi avanzati (es. sotto-categorie materiale) nascosti dietro "Dettagli". Il percorso base è sempre completabile senza aprirli.
9. **Default intelligenti** — categorie materiale pre-compilate in base al tipo di prodotto scelto; l'utente corregge invece di partire da zero.
10. **Empty state = onboarding** — ogni sezione vuota spiega cosa va fatto e ha il bottone per farlo. Mai una pagina bianca.
11. **Regola del picco-fine** — le due schermate migliori del prodotto: il risultato del checker (picco) e la conferma "report generato, pronto da incollare" (fine). Massima cura lì.
12. **Visibilità dello stato del sistema** — ogni azione dà feedback immediato: salvato, calcolato, inviato.
13. **Fiducia sopra tutto** — ogni regola normativa mostrata ha la fonte ufficiale linkata e la data di verifica. Disclaimer fisso nel footer: "Software di supporto, non consulenza legale."
14. **Zero dark pattern** — vietati: contatori finti, "altri 12 stanno guardando", urgenza artificiale, opt-out nascosti, cancellazione difficile. In una categoria basata sulla fiducia, un solo trucco scoperto uccide il brand.

## 9. Copy (le parole sono design)
- Voce: chiara, diretta, competente. Mai burocratese, mai marketing gonfiato.
- Verbi attivi e specifici: "Genera report LUCID", non "Invia". Il nome dell'azione resta identico in tutto il flusso.
- Gli errori dicono cosa è successo e come risolvere: "Peso mancante per 3 prodotti — completali per generare il report", mai "Si è verificato un errore".
- Sentence case ovunque. Niente punti esclamativi nell'app.
- Lingua MVP: italiano. Struttura i testi in file di localizzazione dal giorno 1 (l'inglese arriva presto).

## 10. Pavimento di qualità (non negoziabile)
Responsive fino a 360px · focus visibile da tastiera · contrasto AA · `prefers-reduced-motion` rispettato · stati loading/error/empty per ogni vista dati.
