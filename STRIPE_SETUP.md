# STRIPE_SETUP.md — checklist manuale (Ion)

Tutto il codice Stripe è già cablato e gira su **placeholder mock**: completare
questi step e sostituire i valori env è sufficiente, **nessuna modifica al
codice è richiesta**. Ogni placeholder lasciato nel repo è elencato qui.

## 1. Creare l'account Stripe
- [ ] Registrarsi su https://dashboard.stripe.com (profilo business, Italia/EU).
- [ ] Completare i dati aziendali per l'attivazione dei pagamenti live
      (finché non decisi ragione sociale/P.IVA si può lavorare in test mode).

## 2. Prodotti e prezzi (2 price ANNUALI)
- [ ] Creare il prodotto **Essenziale** con un prezzo ricorrente **annuale**
      di **149€**, tax behavior **exclusive** (i prezzi sono IVA esclusa, B2B).
- [ ] Creare il prodotto **Completo** con un prezzo ricorrente **annuale**
      di **249€**, tax behavior **exclusive**.
- [ ] Copiare i due price ID (`price_...`) — servono al punto 3.
- Nessun prezzo mensile: fatturazione solo annuale (ARCHITECTURE §8).

## 3. Variabili d'ambiente (mock → reali)
Valori mock attualmente in `.env.example` (e da mettere in `.env.local` +
Vercel → Settings → Environment Variables):

| Variabile | Mock nel repo | Valore reale | Dove trovarlo |
|---|---|---|---|
| `STRIPE_SECRET_KEY` | `sk_test_mock` | `sk_test_...` / `sk_live_...` | Dashboard → Developers → API keys (server only, mai nel client) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_mock` | `whsec_...` | Punto 4 (creazione endpoint) o `stripe listen` in locale |
| `NEXT_PUBLIC_STRIPE_PRICE_ESSENZIALE` | `price_mock_essenziale` | `price_...` | Punto 2 |
| `NEXT_PUBLIC_STRIPE_PRICE_COMPLETO` | `price_mock_completo` | `price_...` | Punto 2 |

Con i mock: l'app builda e gira; la CTA di acquisto mostra un errore cortese
("pagamento non configurato") finché la secret key non è reale.

## 4. Webhook
- [ ] Dashboard → Developers → Webhooks → Add endpoint:
      `https://<dominio>/api/stripe/webhook`
- [ ] Selezionare SOLO questi eventi:
      `checkout.session.completed`, `customer.subscription.updated`,
      `customer.subscription.deleted`
- [ ] Copiare il signing secret `whsec_...` in `STRIPE_WEBHOOK_SECRET`.
- Sviluppo locale:
  `stripe listen --forward-to localhost:3000/api/stripe/webhook`
  (il comando stampa un `whsec_...` temporaneo da mettere in `.env.local`;
  `stripe trigger checkout.session.completed` per un evento di prova).
- Il webhook è l'UNICO writer di `companies.plan` (service role, idempotente).

## 5. Customer Portal
- [ ] Dashboard → Settings → Billing → Customer portal: attivarlo.
- [ ] Consentire lo switch di piano tra i due price annuali (upgrade/downgrade).
- [ ] Impostare la policy di cancellazione (a fine periodo) e l'accesso alle
      fatture.
- Nota downgrade: se un'azienda Completo con più di 3 paesi passa a
  Essenziale, i paesi esistenti restano attivi (grandfathering, mai cancellati);
  il limite vale solo per nuove selezioni.

## 6. Stripe Tax (opzionale, decisione tua)
- `automatic_tax` è **volutamente NON attivo** nel codice: richiede Stripe Tax
  configurato a mano (registrazioni fiscali nel dashboard).
- La P.IVA del cliente è già raccolta nel checkout (`tax_id_collection`) e
  finisce sul customer per la fatturazione, MA finché Stripe Tax non è
  configurato le fatture non mostrano IVA né la dicitura reverse-charge.
- [ ] Se/quando configuri Stripe Tax: aggiungere
      `automatic_tax: { enabled: true }` alla creazione della Checkout Session
      in `app/app/piano/actions.ts` (one-line, unica modifica di codice
      prevista da questa checklist).

## 7. Dati societari nelle pagine legali
- [ ] Completare i placeholder `[DA COMPLETARE: ...]` in `locales/it.json`:
      - `privacy.sections` → ragione sociale, indirizzo, P.IVA del titolare
      - `termini.sections` → dati societari e foro competente
- [ ] Verificare l'email di contatto (`privacy.contactEmail`,
      `termini.contactEmail`).

## 8. Altri prerequisiti env (non Stripe, già noti)
- [ ] `NEXT_PUBLIC_SITE_URL` col dominio reale (success/cancel URL del
      checkout e return URL del Portal lo usano; oggi fallback localhost).

## 9. Verifica end-to-end (test mode)
- [ ] Account di prova → onboarding → /app/piano → checkout Essenziale con
      carta `4242 4242 4242 4242` → al ritorno, entro pochi secondi,
      `companies.plan = 'essenziale'` (verificare in Supabase).
- [ ] Report e promemoria sbloccati; import CSV e storico ancora bloccati.
- [ ] Dal Customer Portal: upgrade a Completo → `plan = 'completo'`, import
      CSV e storico sbloccati.
- [ ] Dal Portal: cancellazione immediata (in test) → `plan = 'free'`, gate
      di nuovo attivi.
- [ ] Log webhook puliti nel dashboard Stripe (tutte 2xx).
