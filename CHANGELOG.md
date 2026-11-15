# Changelog

Tutte le modifiche rilevanti a questo progetto sono documentate in questo file.

Il formato segue [Keep a Changelog](https://keepachangelog.com/it/1.1.0/) e il
versioning segue [Semantic Versioning](https://semver.org/lang/it/).

## [Unreleased]

## [1.3.0] - 2026-11-15

### Added

- **Risoluzione dell'impresa (passo 3.4)**: una pastiglia sotto il passo apre un
  popup con **Forza di Volontà** e **Forza di Minaccia**, entrambe con tasti
  `−`/`+` e inserimento diretto. La Volontà può scendere sotto zero, la Minaccia
  no. Il risultato è `Volontà − Minaccia`: se è zero o positivo compare il
  **contatore dei progressi** con l'icona dedicata; se è negativo compare il
  tasto **“Aumenta la minaccia di X”**, che aumenta di X la Minaccia di tutti i
  giocatori con un effetto visivo sui contatori.
- **Icone `willpower.png`, `threat.png` e `progress.png`** usate nel popup e
  aggiunte al precache del service worker.

### Changed

- **Nuovo nome: Rings Turn Log**. Aggiornati brand, titolo della pagina, manifest
  PWA (nome, nome breve, descrizione), titolo iOS, cache del service worker
  (`rings-turn-log-v…`) e chiave di `localStorage` (`rings-turn-log/v1`); i
  salvataggi della chiave precedente vengono letti e migrati da soli. Il nome
  nel brand si compatta sotto i 380 px per lasciare spazio ai comandi.
- Dopo aver applicato l'aumento di Minaccia il popup **si chiude da solo**, così
  l'effetto si vede subito sui contatori; campi e tasti restano bloccati e
  **Annulla** ripristina le Minacce, i valori inseriti e lo sblocco.
- Quando il risultato è zero o positivo, sotto i progressi compare il tasto
  **Chiudi**.
- La risoluzione dell'impresa si azzera al passaggio al turno successivo e con
  “Nuova partita”.

## [1.2.0] - 2026-11-15

### Added

- **Segnalibro su un passo**: tocca il passo (o il nastro accanto) per segnarlo;
  il segnalibro è unico e si sposta toccando un altro passo. La riga segnata
  ha una barra dorata e sullo stepper compare un puntino giallo sulla fase
  corrispondente (anche per i passi dei processi di combattimento, che
  marcano la fase 6).
- **Interfaccia bilingue IT/EN**: il pulsante in alto a destra alterna le due
  lingue e la scelta viene ricordata. Oltre ai testi dell'interfaccia sono
  tradotti i nomi delle fasi, dei processi e i passi del regolamento, le
  etichette della cronologia, i titoli dei popup e i messaggi accessibili.
  I testi inglesi dei passi seguono la terminologia del regolamento.
  La lingua iniziale segue `?lang=`, poi la preferenza salvata, poi la lingua
  del browser, con l'italiano come riserva.
- **Nomi delle fasi sullo stepper del tablet**: con spazio a disposizione ogni
  pulsante 1–7 mostra il numero e il nome della fase.

### Changed

- Il **puntino delle note** sullo stepper è ora **viola**; il segnalibro usa un
  secondo puntino **giallo** in basso a destra, così i due restano distinguibili
  anche sulla fase corrente dorata.
- “Nuova partita” azzera anche il segnalibro (resta recuperabile con Annulla).
- Il pulsante **schermo intero** è stato rimosso dall'header e sostituito dal
  selettore di lingua; il codice e il markup restano pronti per riattivarlo.
- I nomi delle fasi nello stepper si aggiornano insieme alla lingua, senza
  ricreare i pulsanti.
- **Suoni aggiornati**: `tap.mp3`, `undo.mp3` e `new-round.mp3` sono stati
  sostituiti con nuove registrazioni.
- **Icone Radix**: segnalibro, note, rotazione, annulla, nuova partita,
  chiusura e aggiunta usano il set
  [Radix Icons](https://www.radix-ui.com/icons) (MIT). In root ci sono solo
  i file usati; la cartella completa `icons/` è esclusa da git.

## [1.1.1] - 2026-11-14

### Added

- **Suono di undo**: premendo Annulla si sente `undo.mp3` (al posto del tap
  generico). Il file è incluso nel precache del service worker.

### Changed

- **Promemoria della Minaccia più evidente**: anello dorato sulla card, badge
  “!” e suggerimento in una pastiglia dorata, con pulsazione più marcata.
- **AVANTI** e il salto a un'altra fase confermano implicitamente la Minaccia
  iniziale corrente (30): il promemoria si spegne senza cambiare il valore.

### Fixed

- Il promemoria riparte anche con “Nuova partita” quando la Minaccia è rimasta
  al valore di default 30 (prima l'animazione non si riavviava).
- **Fullscreen + rotazione**: le dimensioni dell'interfaccia ruotata sono
  calcolate in pixel e riallineate allo schermo, evitando l'effetto
  “widescreen” con le fasi schiacciate su Android.
- Il service worker completa l'installazione anche se un asset opzionale
  (ad esempio un suono) non è disponibile.

## [1.1.0] - 2026-11-14

### Added

- **Modalità tablet**: da 600 px di lato corto compaiono fino a **4 indicatori
  Minaccia**, uno per giocatore, con nome personalizzabile.
- **Aggiunta e rimozione giocatori** (minimo 1, massimo 4) con tile “Aggiungi
  giocatore”; anche queste azioni sono annullabili.
- **Nome giocatore** modificabile toccando l'etichetta della card; se vuoto
  resta “Giocatore N”.
- **Promemoria della Minaccia per ogni giocatore**: pulsazione e suggerimento
  indipendenti sulla singola card.

### Changed

- Lo stato salvato ora contiene `players` (nome, minaccia, promemoria per
  giocatore) al posto della singola `minaccia`.
- **Ristoro**: +1 Minaccia a tutti i giocatori.
- **Nuova partita**: conserva nomi e roster e riporta a 30 la minaccia di
  ciascun giocatore.
- Sul telefono resta una sola card Minaccia (giocatore 1), con il nome
  accanto se impostato.

### Fixed

- I dialoghi della Minaccia e del nome mostrano il giocatore a cui si
  riferiscono e restano raggiungibili con la tastiera aperta.

### Migration

- I salvataggi della 1.0.0 vengono convertiti automaticamente in un unico
  giocatore con la Minaccia e il promemoria precedenti.

## [1.0.0] - 2026-11-14

Prima release pubblica.

### Added

- **Contatori Turno e Minaccia**: pulsanti `−` / `+` con pressione prolungata
  per scorrere veloce e tap sul numero per impostare un valore qualsiasi
  (default 30). La Minaccia diventa rossa da 50 in su.
- **Tracker delle 7 fasi** con i passi numerati del regolamento (1.1, 1.2, …)
  e le finestre di azione evidenziate.
- **Processi di combattimento in popup**: “Risolvere gli Attacchi dei Nemici”
  e “Risolvere gli Attacchi dei Giocatori”, apribili dai passi 6.4a e 6.8a.
- **Note tra un passo e l'altro**: aggiunta, modifica ed eliminazione,
  più note nello stesso spazio, visualizzazione inline in viola, puntino sullo
  stepper e conservazione dopo “Nuova partita”.
- **AVANTI** fase per fase; dal Ristoro fa partire il turno successivo
  (Turno +1, Minaccia +1, di nuovo Risorsa).
- **Undo** fino a 30 passaggi, incluso l'annullamento di “Nuova partita”.
- **Rotazione dell'interfaccia** tra verticale e orizzontale, con scelta
  ricordata tra le sessioni.
- **Schermo intero** dove supportato dal browser.
- **Blocco schermo on/off** con preferenza salvata e riacquisizione al ritorno
  sull'app.
- **Effetti sonori** per i tap e per l'inizio del nuovo turno.
- **Promemoria della Minaccia iniziale**: al primo avvio e dopo “Nuova partita”
  il contatore pulsa brevemente e resta un suggerimento finché non si imposta
  il valore; i salvataggi delle versioni precedenti non vengono disturbati.
- **PWA installabile e offline first**: manifest, service worker con precache
  di app shell, icone e audio, aggiornamento automatico e funzionamento senza
  rete dopo il primo caricamento.
- **Versionamento visibile**: versione mostrata accanto al brand, con
  `version.js` come unica fonte di verità e cache del service worker legata
  alla versione.
- **Popup allineati in alto e gestione della tastiera**: l'altezza degli
  overlay segue l'area visibile tramite `visualViewport`, anche con
  l'interfaccia ruotata a 90°.

### Changed

- Le **finestre di azione** hanno uno stile più discreto: banda rossa tenue,
  testo allineato a sinistra allo stesso rientro dei passi.
- Il contenuto della card fase è allineato in alto.

[Unreleased]: https://github.com/eonardol/lotr-lcg-memo/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/eonardol/lotr-lcg-memo/releases/tag/v1.2.0
[1.1.1]: https://github.com/eonardol/lotr-lcg-memo/releases/tag/v1.1.1
[1.1.0]: https://github.com/eonardol/lotr-lcg-memo/releases/tag/v1.1.0
[1.0.0]: https://github.com/eonardol/lotr-lcg-memo/releases/tag/v1.0.0
