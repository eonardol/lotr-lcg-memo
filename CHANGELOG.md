# Changelog

Tutte le modifiche rilevanti a questo progetto sono documentate in questo file.

Il formato segue [Keep a Changelog](https://keepachangelog.com/it/1.1.0/) e il
versioning segue [Semantic Versioning](https://semver.org/lang/it/).

## [Unreleased]

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

[Unreleased]: https://github.com/eonardol/lotr-lcg-memo/compare/v1.1.1...HEAD
[1.1.1]: https://github.com/eonardol/lotr-lcg-memo/releases/tag/v1.1.1
[1.1.0]: https://github.com/eonardol/lotr-lcg-memo/releases/tag/v1.1.0

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

[Unreleased]: https://github.com/eonardol/lotr-lcg-memo/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/eonardol/lotr-lcg-memo/releases/tag/v1.0.0
