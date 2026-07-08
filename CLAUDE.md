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
- STATO_PROGETTO.md va mantenuto aggiornato: al termine di ogni task
  significativo (un prompt del kickoff completato, una milestone,
  una decisione ratificata da Ion in chat, un problema nuovo scoperto
  o risolto), l'ultimo step del lavoro è aggiornare STATO_PROGETTO.md:
  spostare la voce nella sezione 3 da ⬜ a ✅ con una riga di sintesi,
  aggiornare la sezione 7 (problemi aperti/backlog: aggiungere i nuovi,
  rimuovere i risolti) e la data in testa al file. Aggiornamenti
  compatti: righe di sintesi, mai log dettagliati — il dettaglio sta
  nei report in chat. NON toccare le sezioni 1, 4 e 5 (identità
  prodotto, decisioni ratificate, regole di lavoro): quelle si
  modificano solo su istruzione esplicita di Ion. Micro-fix e
  modifiche minori NON richiedono aggiornamento.
```
