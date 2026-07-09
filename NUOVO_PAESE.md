# NUOVO_PAESE.md — Aggiungere un paese alla copertura

> **Principio (decisione ratificata da Ion, 2026-07-10):** nessun paese ha
> rilievo visivo speciale nella UI. La copertura è un **dato** derivato a
> runtime dai file `/rules/*.yaml` — mai una costante nel codice. Aggiungere
> un paese richiede **solo un file regole + seed: zero modifiche a codice,
> componenti o copy.**

## Procedura passo-passo

### 1. Ricerca normativa
- Parti da un file esistente come template strutturale: `rules/de.yaml` è il
  più completo (registro, requisiti, reporting con schedule, sanzioni,
  rappresentante autorizzato, fonti).
- Contesto e metodo di ricerca: `docs/ricerca-regole-epr.md`.
- **Regole ferree (CLAUDE.md):**
  - ogni dato normativo DEVE avere una fonte ufficiale in `sources`
    (con `accessed`);
  - valore senza fonte = `null` + commento `TODO-VERIFY` — mai inventare;
  - i campi strutturati (schedule, band, flag) sono solo **specchi** di un
    testo `rule`/`note` già fontato nello stesso blocco, mai valori nuovi;
  - il file nasce con `status: draft`.

### 2. Crea il file regole
- Percorso: `rules/<codice-iso-minuscolo>.yaml` (es. `rules/es.yaml`).
- Il nome file DEVE essere il codice ISO 3166-1 alpha-2 in minuscolo e
  `country_code` lo stesso codice in maiuscolo: i test lo verificano
  (`lib/rules/coverage.test.ts`, `lib/engine/check-obligations.test.ts`).
- `country_name` in italiano (es. `Spagna`) — è il nome mostrato da motore,
  email e landing.
- Solo stati membri UE: il paese deve essere in `EU_MEMBER_STATES`
  (`lib/engine/eu-countries.ts`). Un paese extra-UE non è supportato dal
  modello attuale.

### 3. Valida
```
npm run validate-rules   # schema Zod, nessun DB richiesto
npm test                 # la suite deriva la copertura dai file: si adatta da sola
```
Nessun test va aggiornato a mano: le asserzioni sulla copertura leggono
l'elenco dei file in `/rules`.

### 4. Verifica umana
- Revisione delle fonti da parte di Ion (o delegato).
- Alla ratifica: imposta `last_verified_by_human: YYYY-MM-DD` e
  `status: verified` (lo schema rifiuta `verified` senza data).
- Finché resta `draft`, risultato ed email mostrano automaticamente
  l'avviso "Dati normativi in fase di verifica".

### 5. Seed
```
npm run seed-rules       # upsert nella tabella `countries` (Supabase)
```
Serve per l'app autenticata (onboarding e cruscotto): la tabella `countries`
è l'insieme dei paesi persistibili in `company_countries`.

### 6. Deploy
Il resto si aggiorna da solo al deploy:
- **Checker step 2 / onboarding:** il paese era già nella griglia dei 27; da
  ora rientra nella microcopy "Analisi dettagliata oggi per: …".
- **Risultato, email report, guida SEO (`/guide/<codice>`):** generati dal
  motore sul nuovo file.
- **Landing (anteprima hero, meta description) e og:image:** elenchi di
  registri/paesi generati da `lib/rules/coverage.ts`.
- **Analytics:** il paese esce da `notCoveredCountries` in `checker_result`
  e da `onboarding_interest_countries`.

## Checklist finale
- [ ] `rules/<codice>.yaml` con fonti complete, `status` corretto
- [ ] `npm run validate-rules` verde
- [ ] `npm test` verde (nessun test toccato a mano)
- [ ] Bandiera presente: già garantita — tutte e 27 le bandiere UE esistono
      in `lib/checker/flags.ts` e un test (`options.test.ts`) lo impone
- [ ] Nome paese in `it.json` (`countries.<CODICE>`): già presente per tutti
      i 27 — un test lo impone
- [ ] `npm run seed-rules` eseguito verso il progetto Supabase
- [ ] Nessun altro passo: se ne scopri uno, è un bug di architettura — va
      corretto il codice, non aggiunto un passo qui

## Copy opzionale (non bloccante)
Due chiavi it.json possono rifinire il testo per il nuovo paese; hanno
entrambe un fallback automatico e NON sono richieste:
- `check.result.domestic.<CODICE>` — copy dedicata al caso domestico
  (fallback: `check.result.domestic.default` con il nome paese);
- `check.result.ar.<CODICE>.{eu,non_eu}` — copy dedicata sul rappresentante
  autorizzato (fallback: le `notes` fontate del YAML).
