# Changelog

Tutte le modifiche rilevanti a questo progetto sono documentate in questo file.

Il formato segue [Keep a Changelog](https://keepachangelog.com/it/1.1.0/) e il
versioning segue [Semantic Versioning](https://semver.org/lang/it/).

## [Unreleased]

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
