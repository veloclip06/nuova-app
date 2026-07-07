# Regole EPR Imballaggi — Germania, Francia, Italia (per venditore e-commerce)

## TL;DR
- I tre paesi hanno tre architetture diverse: **DE = registro pubblico (LUCID/ZSVR) + contratto con un sistema duale**; **FR = adesione a un éco-organisme agréé (Citeo/Léko/Adelphe) che registra il produttore su SYDEREP e gli fa avere l'IDU ADEME**; **IT = adesione a CONAI (consorzio privato ad adesione obbligatoria, NON un registro pubblico) + versamento del Contributo Ambientale (CAC)**.
- **Soglie de minimis**: nessuna in Germania (obbligo dalla prima confezione); in Francia esiste solo la *déclaration au forfait* di 80 € HT per chi immette meno di 10.000 UVC/anno (non esonera dall'obbligo); in Italia l'adesione a CONAI è sempre obbligatoria, ma esiste una soglia di *esenzione dal versamento* di 200 €/materiale (procedura ordinaria) o 300 €/materiale (procedura semplificata).
- **Rappresentante autorizzato = INCERTEZZA da monitorare**: il PPWR (Reg. UE 2025/40) art. 45(3) lo imporrebbe dal 12/08/2026 per chi vende a distanza in uno Stato UE dove non è stabilito, ma la proposta COM/2025/982 (Environmental Omnibus, 10/12/2025) ne sospenderebbe l'obbligo per i produttori stabiliti nell'UE fino al 1/1/2035. A luglio 2026 la proposta è ancora pendente in Parlamento/Consiglio (procedura legislativa ordinaria); per i produttori extra-UE l'obbligo (o misure alternative di tracciabilità decise dallo Stato membro) resterebbe comunque.

## Key Findings
- **Germania**: registrazione LUCID gratuita, personale (non delegabile, §9/§33 VerpackG) e obbligatoria prima della prima vendita, senza soglie. Volumi: dichiarazione iniziale pianificata entro il 31 dicembre e dichiarazione di fine anno (effettiva) entro il 15 maggio dell'anno successivo, sia a LUCID sia al sistema duale, con dati che devono coincidere. Sanzioni fino a 200.000 € (§36 VerpackG); casi reali documentati dalla ZSVR includono arretrati di almeno 2 milioni € per una farmacia online estera che non aveva aderito al sistema duale per anni, e una multa di 35.750 € (confermata in tribunale) a un'azienda alimentare per omessa Vollständigkeitserklärung per quattro anni. Amazon blocca le inserzioni DE senza LUCID valido dal 15 giugno 2022.
- **Francia**: obbligo di aderire a un éco-organisme agréé; l'IDU (identifiant unique) è generato dall'ADEME e comunicato dall'éco-organisme pochi giorni dopo l'adesione, e va indicato nelle CGV e sul sito (art. R541-173), ma non è richiesto per legge in fattura. Finestra di dichiarazione annuale: dal 1 gennaio al 28 febbraio, per gli imballaggi immessi l'anno precedente. Il produttore non stabilito in Francia deve nominare un mandataire stabilito in Francia (art. R541-174). Sanzione amministrativa fino a 30.000 €.
- **Italia**: CONAI è un consorzio privato ad adesione obbligatoria, non un registro pubblico. Dichiarazioni periodiche (annuale/trimestrale/mensile a seconda del CAC dell'anno precedente per materiale) entro il 20 del mese successivo al periodo. Il venditore UE non stabilito NON ha obblighi CONAI *salvo* che venda tramite piattaforma e-commerce (art. 178-quater D.Lgs. 152/2006); il venditore extra-UE senza sede secondaria che aderisce deve prestare garanzie a copertura del CAC dei 12 mesi successivi.

## Details

### Blocco YAML — GERMANIA

```yaml
country_code: DE
country_name: Germania
status: draft
last_verified_by_human: null

register:
  name: LUCID
  authority: Zentrale Stelle Verpackungsregister (ZSVR)
  portal_url: https://lucid.verpackungsregister.org
  languages: [de, en]
  cost_registration: 0            # la registrazione LUCID è gratuita (fonte ZSVR)

scope:
  who_is_obligated: >
    Chiunque immetta per la prima volta a titolo commerciale sul mercato tedesco
    imballaggi riempiti di merce destinati al consumatore finale privato
    (produttori, distributori, importatori, venditori online e per corrispondenza),
    incluse le vendite a distanza dall'estero, indipendentemente dalla sede
    dell'azienda. La registrazione è personale e non delegabile a terzi
    (§9 e §33 VerpackG).
  de_minimis: none            # nessuna soglia minima — obbligo dalla prima confezione
  marketplace_enforcement: >
    Amazon blocca le inserzioni sul marketplace DE senza numero LUCID valido
    dal 15 giugno 2022 (obbligo legale in vigore dal 1 luglio 2022).

requirements:
  - id: register_lucid
    label: Registrazione nel registro LUCID
    when: prima della prima vendita
  - id: system_participation
    label: Contratto con un sistema duale (Systembeteiligung / licenza imballaggi)
    when: prima della prima vendita
    note: >
      Il nostro software NON vende la licenza — linka i sistemi duali autorizzati
      (es. Der Grüne Punkt, Interseroh/Lizenzero, Reclay, Landbell, PreZero,
      Noventiz, BellandVision, EKO-Punkt, Zentek, Recycling Kontor Dual).
  - id: volume_report
    label: Dichiarazione volumi per materiale a LUCID e al sistema duale
    when: vedi reporting
    note: I dati comunicati a LUCID e al sistema duale devono coincidere esattamente (controllo incrociato ZSVR).

reporting:
  frequency: annual_plus_initial
  period_format: "YYYY"
  deadlines:
    - kind: initial_planned_volume_report
      rule: entro il 31 dicembre dell'anno precedente / prima della messa in commercio
    - kind: year_end_report
      rule: entro il 15 maggio dell'anno successivo (a LUCID e al sistema duale)
    - kind: declaration_of_completeness   # Vollständigkeitserklärung
      rule: >
        entro il 15 maggio, SOLO sopra le soglie §11(4) VerpackG:
        80.000 kg vetro, 50.000 kg carta/cartone (PPK), 30.000 kg altri materiali;
        richiede audit di un revisore registrato ZSVR.
  method: portale LUCID (inserimento manuale in kg, tre decimali, per materiale) + interfaccia XML

material_categories:           # tassonomia canonica -> categorie ufficiali LUCID (VerpackG). Fonte: Prüfleitlinien ZSVR 19/11/2024 (con codici materiale)
  - canonical: paper_cardboard
    local_name: "Papier, Pappe, Karton (PPK)"   # codice 20000
  - canonical: plastic
    local_name: "Kunststoffe"                    # codice 50000
  - canonical: glass
    local_name: "Glas"                           # codice 10000
  - canonical: ferrous_metal
    local_name: "Eisenmetalle"                   # codice 30000
  - canonical: aluminium
    local_name: "Aluminium"                      # codice 40000
  - canonical: wood
    local_name: "Sonstiges Material"             # codice 80000 — NON esiste categoria separata "Holz"; il legno si dichiara qui
  - canonical: composite_beverage
    local_name: "Getränkekartonverpackungen"     # codice 60000
  - canonical: composite_other
    local_name: "Sonstige Verbundverpackungen"   # codice 70000
  - canonical: other
    local_name: "Sonstiges Material"             # codice 80000

penalties:
  summary: >
    §36 Abs.2 VerpackG: fino a 200.000 € nei casi dell'Abs.1 nn. 3,4,12,13,18
    (tra cui immissione senza corretta partecipazione al sistema); fino a 100.000 €
    nei casi nn. 1,5,5a,6,7,8,11,14-17,19-23,25,26 (tra cui registrazione);
    fino a 10.000 € negli altri casi. Divieto di vendita e scrematura dei profitti
    indebiti (§37). Casi reali ZSVR: arretrati di almeno 2 mln € per omessa
    partecipazione al sistema; multa di 35.750 € per omessa Vollständigkeitserklärung.
  detail_url: https://www.gesetze-im-internet.de/verpackg/__36.html

authorised_representative:
  required_for_non_established: uncertain
  note: >
    PPWR art. 45(3) (Reg. UE 2025/40) imporrebbe il rappresentante autorizzato EPR
    dal 12/08/2026 per chi vende a distanza in uno Stato UE dove non è stabilito,
    MA la proposta COM/2025/982 (Environmental Omnibus, 10/12/2025) sospenderebbe
    l'obbligo per i produttori stabiliti nell'UE fino al 1/1/2035. A luglio 2026 la
    proposta è ancora pendente in Parlamento/Consiglio. Per produttori extra-UE
    l'obbligo (o misure alternative di tracciabilità decise dallo Stato membro)
    resterebbe. Trattare come INCERTO, mostrare con disclaimer, monitorare.

sources:
  - title: VerpackG §36 (Bußgeldvorschriften) — Gesetze im Internet
    url: https://www.gesetze-im-internet.de/verpackg/__36.html
    accessed: 2026-07-06
  - title: ZSVR — Datenmeldung (obbligo di dichiarazione dati e scadenze)
    url: https://www.verpackungsregister.org/en/system-participation-data-reporting/data-reporting
    accessed: 2026-07-06
  - title: ZSVR — Registrazione LUCID (gratuita, personale)
    url: https://www.verpackungsregister.org/en/registration/find-out-about-registrations
    accessed: 2026-07-06
  - title: ZSVR — Vollständigkeitserklärung (soglie §11(4))
    url: https://www.verpackungsregister.org/en/system-participation-data-reporting/declaration-of-completeness
    accessed: 2026-07-06
  - title: ZSVR — Prüfleitlinien Vollständigkeitserklärung (elenco Materialarten con codici)
    url: https://www.verpackungsregister.org/fileadmin/files/Prüfleitlinien/2024_Pruefleitlinien_Vollstaendigkeitserklaerung.pdf
    accessed: 2026-07-06
  - title: Amazon Seller Central DE — EPR compliance (LUCID)
    url: https://sell.amazon.de/en/einhaltung-der-erweiterten-herstellerverantwortung
    accessed: 2026-07-06
  - title: EUR-Lex — Reg. UE 2025/40 (PPWR), art. 45
    url: https://eur-lex.europa.eu/eli/reg/2025/40/oj/eng
    accessed: 2026-07-06
  - title: EUR-Lex — COM/2025/982 (sospensione AR per produttori UE fino 2035)
    url: https://eur-lex.europa.eu/legal-content/AUTO/?uri=CELEX%3A52025PC0982
    accessed: 2026-07-06
```

### Blocco YAML — FRANCIA

```yaml
country_code: FR
country_name: Francia
status: draft
last_verified_by_human: null

register:
  name: SYDEREP (registro ADEME) + adesione a éco-organisme agréé
  authority: >
    ADEME (Agence de la transition écologique) — registro nazionale/IDU;
    éco-organismes agréés (Citeo, Léko, Adelphe) — gestione operativa della REP
    emballages ménagers
  portal_url: https://www.citeo.com          # adesione all'éco-organisme; IDU consultabile su https://syderep.ademe.fr/public/acteur/recherche
  languages: [fr, en]
  cost_registration: null    # TODO-VERIFY: non esiste un "costo di registrazione" del registro. All'adesione a Citeo è richiesto un minimo contributivo di 80 € HT (contributo, non tassa di registro)

scope:
  who_is_obligated: >
    Ogni "producteur" che immette per la prima volta sul mercato francese prodotti
    imballati destinati (anche parzialmente) ai nuclei domestici: fabbricante,
    distributore, importatore/introducteur, incluso il venditore a distanza senza
    stabilimento in Francia. La responsabilità scatta con la prima immissione sul
    mercato francese, indipendentemente dalla sede del venditore. Le vendite
    dall'estero (UE ed extra-UE) rientrano nella REP emballages ménagers.
  de_minimis: >
    Nessuna soglia esonera dall'obbligo. Esiste però la "déclaration au forfait":
    i piccoli produttori con meno di 10.000 UVC (unità di vendita al consumatore)
    all'anno pagano una contribuzione forfettaria di 80 € HT (dichiarazione validata
    "in 3 clic"; alla adesione si riceve una fattura provvisoria di 80 € HT).
  marketplace_enforcement: >
    Amazon richiede l'UIN/IDU per la Francia e blocca/limita le inserzioni dei
    venditori non conformi; se il venditore terzo non fornisce l'IDU, il marketplace
    ne assume la responsabilità (art. L541-10-9) e può attivare il "Pay on Behalf".

requirements:
  - id: appoint_mandataire
    label: Nomina di un mandataire stabilito in Francia (per non stabiliti)
    when: prima dell'adesione
    note: Richiesto per i produttori senza stabilimento in Francia (art. R541-174). Vedi authorised_representative — interazione con PPWR/COM 2025/982.
  - id: join_eco_organisme
    label: Adesione a un éco-organisme agréé (Citeo, Léko o Adelphe)
    when: prima della prima immissione sul mercato
    note: Il produttore non può iscriversi da solo a SYDEREP in caso di sistema collettivo; è l'éco-organisme a registrarlo e a comunicargli l'IDU.
  - id: obtain_idu
    label: Ottenimento dell'IDU (identifiant unique) generato dall'ADEME
    when: pochi giorni dopo l'adesione
    note: >
      Obbligatorio dal 1 gennaio 2022 (art. L541-10-13). Va indicato nelle CGV e sul
      sito web (art. R541-173). NON è richiesto per legge in fattura (fonte ecosystem).
  - id: triman_infotri
    label: Apposizione della segnaletica Triman + Info-tri sugli imballaggi
    when: dalla messa in commercio
    note: Obbligatoria dal 1 gennaio 2022 (loi AGEC).
  - id: annual_declaration
    label: Dichiarazione annuale dei tonnellaggi/UVC e versamento eco-contributo
    when: vedi reporting

reporting:
  frequency: annual
  period_format: "YYYY"
  deadlines:
    - kind: annual_declaration
      rule: dichiarazione a Citeo dal 1 gennaio al 28 febbraio, riferita agli imballaggi immessi l'anno precedente
    - kind: payment
      rule: >
        se il contributo annuo > 5.000 €: fatture provvisorie trimestrali;
        se < 5.000 €: fattura annuale, pagata a dicembre (fonte Citeo, "My membership")
  method: Espace Client dell'éco-organisme (dichiarazione per UVC o forfait); dati per materiale in peso

material_categories:           # tassonomia canonica -> famiglie di materiali Citeo. Fonte: guide tarif Citeo / méthodologie recyclabilité
  - canonical: paper_cardboard
    local_name: "Papier-carton (papier, carton ondulé, carton plat)"
  - canonical: plastic
    local_name: "Plastique (PET, PE, PP, PS/PSE, autres résines/PVC)"
  - canonical: glass
    local_name: "Verre"
  - canonical: ferrous_metal
    local_name: "Acier"
  - canonical: aluminium
    local_name: "Aluminium"
  - canonical: wood
    local_name: "Autres matériaux : bois, liège, textile"   # TODO-VERIFY: il bois non transformé di foreste gestite in modo sostenibile può non essere soggetto a contributo
  - canonical: composite_beverage
    local_name: "Briques (papier-carton pour liquides alimentaires)"   # in Citeo le briques rientrano nella famiglia papier-carton
  - canonical: composite_other
    local_name: "Multi-matériaux sans matériau majoritaire / autres matériaux"   # TODO-VERIFY denominazione esatta a barème
  - canonical: other
    local_name: "Autres matériaux : grès, céramique, porcelaine"

penalties:
  summary: >
    Sanzione amministrativa fino a 30.000 € (per mancata registrazione,
    dichiarazione erronea o mancata indicazione dell'IDU — art. L541-9-5 /
    L541-10-13 Code de l'environnement). La mancata apposizione della segnaletica
    Triman può comportare multe fino a 15.000 € per referenza (TODO-VERIFY importo su fonte primaria).
  detail_url: https://www.legifrance.gouv.fr/codes/id/LEGISCTA000006159421/

authorised_representative:
  required_for_non_established: yes_currently_uncertain_future
  note: >
    Attualmente il produttore non stabilito in Francia deve nominare un mandataire
    stabilito in Francia (art. R541-174). Con il PPWR art. 45(3) dal 12/08/2026 l'AR
    diverrebbe requisito armonizzato UE, ma la proposta COM/2025/982 sospenderebbe
    l'obbligo per i produttori UE fino al 1/1/2035; a luglio 2026 pendente. Per gli
    extra-UE l'obbligo resterebbe. Trattare come INCERTO, mostrare con disclaimer.

sources:
  - title: ADEME — Identifiant unique (IDU) filières REP
    url: https://filieres-rep.ademe.fr/identifiant-unique
    accessed: 2026-07-06
  - title: ADEME — FAQ filières REP (obbligo IDU, mandataire)
    url: https://filieres-rep.ademe.fr/faq
    accessed: 2026-07-06
  - title: Citeo — Adhérer à Citeo (REP emballages et papiers graphiques)
    url: https://www.citeo.com/en/why-join-citeo/
    accessed: 2026-07-06
  - title: Citeo — My membership (finestra 1 gen–28 feb; fatturazione)
    url: https://www.citeo.com/en/my-membership/
    accessed: 2026-07-06
  - title: Citeo — Déclarer vos emballages
    url: https://www.citeo.com/declarer/
    accessed: 2026-07-06
  - title: Légifrance — Arrêté 7 décembre 2023 (cahier des charges éco-organismes emballages ménagers)
    url: https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000048543633
    accessed: 2026-07-06
  - title: Amazon Seller Central FR — EPR (UIN)
    url: https://sell.amazon.fr/en/conformite-a-la-responsabilite-elargie-des-producteurs
    accessed: 2026-07-06
  - title: EUR-Lex — Reg. UE 2025/40 (PPWR), art. 45
    url: https://eur-lex.europa.eu/eli/reg/2025/40/oj/eng
    accessed: 2026-07-06
  - title: EUR-Lex — COM/2025/982 (sospensione AR)
    url: https://eur-lex.europa.eu/legal-content/AUTO/?uri=CELEX%3A52025PC0982
    accessed: 2026-07-06
```

### Blocco YAML — ITALIA

```yaml
country_code: IT
country_name: Italia
status: draft
last_verified_by_human: null

register:
  name: CONAI (non è un registro pubblico; è un consorzio privato ad adesione obbligatoria)
  authority: >
    Ministero dell'Ambiente e della Sicurezza Energetica (vigilanza);
    CONAI + 7 Consorzi di filiera (gestione). Registro Nazionale Produttori (RENAP)
    previsto ma non ancora operativo (art. 178-ter c.8 D.Lgs. 152/2006)
  portal_url: https://dichiarazioni.conai.org
  languages: [it, en]
  cost_registration: 5.16   # quota fissa una tantum in euro; più eventuale quota variabile in base ai ricavi (imprese con ricavi > 500k €)

scope:
  who_is_obligated: >
    I "produttori" (fornitori di materiali, fabbricanti, trasformatori, importatori
    di imballaggi vuoti) e gli "utilizzatori" (chi confeziona/importa merci imballate)
    che per primi immettono l'imballaggio sul mercato nazionale (art. 221 D.Lgs.
    152/2006). Il Contributo Ambientale (CAC) si applica alla "prima cessione".
    Gli utenti finali sono esclusi salvo quando importano direttamente merce imballata
    o svolgono attività commerciale con la merce imballata acquistata.
  de_minimis: >
    Nessuna soglia esonera dall'ADESIONE (obbligatoria entro 30 gg dall'inizio attività).
    Esiste una soglia di ESENZIONE dal versamento del contributo: fino a 200 €/materiale
    (procedura ordinaria) e 300 €/materiale (procedura semplificata) di CAC nell'anno
    solare precedente. NB: fonti storiche riportano soglie diverse (50/100 €) —
    usare i valori della Guida al Contributo Ambientale CONAI 2025/2026.
  marketplace_enforcement: >
    Amazon per l'Italia non applicava lo stesso blocco pre-vendita di DE/FR; se il
    venditore non fornisce il numero EPR, Amazon può iscriverlo d'ufficio al servizio
    "Pay on Behalf" con costi aggiuntivi. TODO-VERIFY stato attuale 2026 su Seller Central IT.

requirements:
  - id: join_conai
    label: Adesione a CONAI (domanda + versamento quota)
    when: entro 30 giorni dall'inizio dell'attività
    note: L'adesione ai singoli Consorzi di filiera avviene in rapporto ai materiali immessi.
  - id: foreign_domicile
    label: Elezione di domicilio speciale in Italia (per imprese estere che aderiscono)
    when: all'adesione
    note: >
      Impresa estera UE che vende via piattaforma e-commerce è soggetta (art. 178-quater,
      con modalità semplificate previste dagli accordi piattaforma-EPR); altrimenti può
      aderire volontariamente eleggendo domicilio speciale in Italia (aziendaestera@conai.org).
      Impresa extra-UE senza sede secondaria deve prestare garanzie a copertura del CAC
      dovuto nei 12 mesi successivi. San Marino: condizioni pari alle imprese italiane.
  - id: cac_invoice_wording
    label: Indicazione in fattura "Contributo ambientale CONAI assolto"
    when: alla prima cessione
  - id: periodic_declaration
    label: Dichiarazione periodica dei quantitativi e versamento CAC
    when: vedi reporting

reporting:
  frequency: variable   # annuale / trimestrale / mensile in base al CAC dell'anno precedente per materiale
  period_format: "periodo (mese / trimestre / anno)"
  deadlines:
    - kind: annual
      rule: entro il 20 gennaio dell'anno successivo (se CAC anno precedente <= 3.000 €/materiale)
    - kind: quarterly
      rule: entro il 20 del mese successivo al trimestre (se CAC > 3.000 e <= 31.000 €/materiale)
    - kind: monthly
      rule: entro il 20 del mese successivo (se CAC > 31.000 €/materiale)
  method: servizio "Dichiarazioni online" su https://dichiarazioni.conai.org (obbligatorio); versamento al ricevimento delle fatture CONAI

material_categories:           # tassonomia canonica -> materiali CONAI (7) e Consorzi di filiera
  - canonical: paper_cardboard
    local_name: "Carta"          # Consorzio COMIECO
  - canonical: plastic
    local_name: "Plastica"       # Consorzio COREPLA
  - canonical: glass
    local_name: "Vetro"          # Consorzio COREVE
  - canonical: ferrous_metal
    local_name: "Acciaio"        # Consorzio RICREA
  - canonical: aluminium
    local_name: "Alluminio"      # Consorzio CIAL
  - canonical: wood
    local_name: "Legno"          # Consorzio RILEGNO
  - canonical: composite_beverage
    local_name: "Imballaggi compositi a base carta / contenitori per liquidi (CAC carta)"   # attribuiti a COMIECO; diversificazione contributiva per tipologie A/B/C/D
  - canonical: composite_other
    local_name: "Imballaggi compositi (attribuiti al materiale prevalente)"   # CONAI non ha una categoria dichiarativa separata per i compositi non-carta
  - canonical: other
    local_name: "Bioplastica (plastica biodegradabile e compostabile)"   # Consorzio Biorepack — 7° materiale/consorzio

penalties:
  summary: >
    Art. 261 D.Lgs. 152/2006: 5.000 € per produttori/utilizzatori che non aderiscono
    a CONAI; da 15.500 € a 46.500 € per i produttori che non aderiscono ai Consorzi di
    filiera (importi da Abstract Guida CONAI 2025). Restano dovuti la quota di adesione
    e i contributi pregressi. NB: alcune fonti secondarie riportano 10.000-60.000 € —
    CONFLITTO da verificare sul testo di legge aggiornato (art. 261 c.1 richiama 5.000 €
    per la mancata raccolta ex art. 221 c.2).
  detail_url: https://www.brocardi.it/codice-dell-ambiente/parte-quarta/titolo-vi/capo-i/art261.html

authorised_representative:
  required_for_non_established: uncertain
  note: >
    Oggi non esiste un "rappresentante autorizzato EPR" in senso PPWR per gli imballaggi
    in Italia; l'impresa estera che aderisce a CONAI elegge un domicilio speciale in Italia
    (o presta garanzie se extra-UE). Con il PPWR art. 45(3) dal 12/08/2026 l'AR diverrebbe
    requisito UE, ma COM/2025/982 lo sospenderebbe per i produttori UE fino al 1/1/2035
    (pendente a luglio 2026). Il RENAP (registro nazionale produttori) è previsto ma non
    ancora operativo. Trattare come INCERTO, monitorare.

sources:
  - title: CONAI — Soggetti obbligati e modalità di adesione (incl. art. 178-quater, imprese estere)
    url: https://www.conai.org/imprese/servizi-gestione-adempimenti-consortili-e-opportunita-imprese/soggetti-obbligati-e-modalita-di-adesione/
    accessed: 2026-07-06
  - title: CONAI (EN) — Declaration and payment (periodicità e scadenze)
    url: https://www.conai.org/en/companies/services-for-managing-consortium-obligations-and-business-opportunities/epr-fee/declaration-and-payment/
    accessed: 2026-07-06
  - title: CONAI — Consorzi di filiera del Sistema CONAI (7 materiali)
    url: https://www.conai.org/consorzi-di-filiera-del-sistema-conai/
    accessed: 2026-07-06
  - title: CONAI — Abstract Guida al Contributo Ambientale 2025 (sanzioni art. 261)
    url: https://www.conai.org/wp-content/uploads/2025/01/ABSTRACT-GUIDA-CONAI-2025-1.pdf
    accessed: 2026-07-06
  - title: Brocardi — Art. 261 D.Lgs. 152/2006 (testo)
    url: https://www.brocardi.it/codice-dell-ambiente/parte-quarta/titolo-vi/capo-i/art261.html
    accessed: 2026-07-06
  - title: EUR-Lex — Reg. UE 2025/40 (PPWR), art. 45
    url: https://eur-lex.europa.eu/eli/reg/2025/40/oj/eng
    accessed: 2026-07-06
  - title: EUR-Lex — COM/2025/982 (sospensione AR)
    url: https://eur-lex.europa.eu/legal-content/AUTO/?uri=CELEX%3A52025PC0982
    accessed: 2026-07-06
```

## Recommendations
1. **Ora**: caricare i tre blocchi con `status: draft` e `last_verified_by_human: null`. Non far passare a `verified` finché tutti i campi marcati TODO-VERIFY non sono confermati su fonte primaria.
2. **Verifica prioritaria (prima del rilascio in produzione del motore di regole)**:
   - Confermare la struttura sanzioni CONAI sul testo integrale aggiornato dell'art. 261 (risolvere il conflitto 5.000 / 15.500–46.500 vs 10.000–60.000).
   - Scaricare la Guida CONAI 2026 per fissare le soglie di esenzione e le soglie di periodicità 2026 (a valere per l'anno corrente).
   - Verificare la denominazione esatta a barème Citeo 2026 per `composite_other` e per il `bois`, e confermare se il bois non transformé è esente da contributo.
3. **Monitoraggio continuo (impostare un alert)**: iter di COM/2025/982 in Parlamento/Consiglio e data effettiva di applicazione del PPWR (12/08/2026, con richiesta tedesca di rinvio a gennaio 2027). Questo determina il valore di `authorised_representative.required_for_non_established` in tutti e tre i blocchi.
4. **Soglie/benchmark che cambierebbero le raccomandazioni**: se COM/2025/982 viene adottata → per i venditori stabiliti in Italia (UE) l'AR resta *opzionale* in DE e FR fino al 2035 (mostrare disclaimer "non obbligatorio ma consigliato"); se NON adottata e il PPWR entra in vigore il 12/08/2026 → l'AR diventa *obbligatorio* per il venditore italiano che vende in DE e FR (aggiornare i tre blocchi a `required_for_non_established: yes`). Per il venditore extra-UE, in entrambi gli scenari l'AR (o misura di tracciabilità alternativa) resta necessario.

## Caveats
- Le società di compliance (Lizenzero, Ecosistant, Deutsche Recycling, ecc.) sono state usate solo per orientamento; tutti i valori normativi provengono da fonti ufficiali o primarie (VerpackG, ZSVR, ADEME, Citeo, CONAI, EUR-Lex, Légifrance).
- Il caso extra-UE è meno coperto da fonti ufficiali per FR e DE rispetto al caso UE: le note nei blocchi riflettono la prassi documentata (mandataire in FR, garanzie/domicilio in IT) ma andrebbero riconfermate con l'autorità/éco-organisme al momento dell'onboarding di un cliente extra-UE.
- Le pagine web pubbliche di "Datenmeldung" della ZSVR elencano le Materialarten solo a titolo di esempio; l'elenco completo e ufficiale delle 8 categorie con i codici (10000–80000) proviene dalle Prüfleitlinien ZSVR (19/11/2024) e non da una singola pagina HTML — è comunque una pubblicazione ufficiale ZSVR.
- Attenzione all'ambiguità sull'8ª categoria tedesca: il termine ufficiale nelle Prüfleitlinien è "Sonstiges Material" (codice 80000), mentre l'interfaccia LUCID e alcuni materiali dei sistemi duali usano varianti come "sonstige Materialien". In DE il `wood` e `other` mappano entrambi allo stesso codice 80000.

## Le 10 cose più incerte da verificare a mano (dalla più grave/rischiosa alla meno grave)
1. **Rappresentante autorizzato / COM/2025/982**: stato dell'iter legislativo e conseguente obbligo effettivo di AR dal 12/08/2026 per il venditore italiano che vende in DE/FR e per il venditore extra-UE. È il campo a più alto impatto legale e commerciale su tutti e tre i blocchi.
2. **Sanzioni CONAI (Italia)**: conflitto tra gli importi delle fonti (5.000 € e 15.500–46.500 € per Consorzi di filiera secondo l'Abstract Guida CONAI 2025, vs 10.000–60.000 € citati altrove). Verificare sul testo integrale e vigente dell'art. 261 D.Lgs. 152/2006.
3. **Soglie CONAI 2026** (esenzione dal versamento e soglie di periodicità mensile/trimestrale/annuale): confermare i valori aggiornati sulla Guida al Contributo Ambientale 2026.
4. **Calendario di pagamento Citeo (Francia)**: confermare la regola fatturazione trimestrale sopra 5.000 € / annuale con pagamento a dicembre sotto 5.000 €, e l'eventuale scadenza del 30 aprile per il versamento.
5. **Marketplace enforcement Italia 2026**: verificare su Amazon Seller Central IT se le inserzioni senza numero EPR imballaggi vengono bloccate o solo iscritte a "Pay on Behalf".
6. **Denominazioni esatte a barème Citeo** per `composite_other` (multi-matériaux) e per il `bois` (e se il bois non transformé è esente).
7. **IDU in fattura (Francia)**: confermare che l'IDU vada indicato solo in CGV/sito e non in fattura (fonti concordano ma è un dettaglio operativo sensibile).
8. **Applicazione anticipata del PPWR in Francia** (progetto di decreto per emballages professionnels dal 1/1/2026) e suo eventuale impatto sulla definizione di "producteur"/donneur d'ordre.
9. **Stato del RENAP (Italia)**: verificare se il Registro Nazionale Produttori è diventato operativo, poiché cambierebbe la struttura di registrazione per le imprese estere UE.
10. **Importo esatto della sanzione Triman (Francia)**: confermare il tetto (indicato come fino a 15.000 € per referenza) su fonte primaria (Code de l'environnement / décret).
