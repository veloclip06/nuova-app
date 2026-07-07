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
