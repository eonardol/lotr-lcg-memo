# Turno · LOTR LCG

Webapp leggera di supporto per **Il Signore degli Anelli LCG**, pensata per il telefono e per il tablet.

- **Turno** e **Minaccia** (una per giocatore) con pulsanti `−` / `+` (pressione prolungata per scorrere veloce).
- Tap sul numero della Minaccia per impostarla a un valore qualsiasi (default 30).
- **Multi-giocatore su tablet** (lato corto ≥ 600 px): fino a **4 indicatori Minaccia**, uno per giocatore, con nome personalizzabile (minimo 1, massimo 4). Sul telefono resta la card singola del giocatore 1.
- **Promemoria Minaccia iniziale**: al primo avvio e dopo “Nuova partita” la card pulsa con un anello dorato, mostra il badge “!” e una pastiglia “Imposta la minaccia iniziale” finché non imposti il valore (30 è solo un default), per ciascun giocatore. Se premi AVANTI o salti a un'altra fase, il valore corrente (30) viene considerato confermato.
- **Tracker delle 7 fasi** con tutti i passi numerati del regolamento (1.1, 1.2, …) e le **finestre di azione** evidenziate in rosso.
- **Processi di combattimento in popup**: “Risolvere gli Attacchi dei Nemici” e “Risolvere gli Attacchi dei Giocatori”, apribili dai passi 6.4a e 6.8a.
- **Segnalibro su un passo**: il nastro accanto a ogni passo segna un solo punto alla volta; la riga si evidenzia e sullo stepper compare un puntino giallo sulla fase corrispondente (i processi di combattimento marcano la fase 6). “Nuova partita” lo azzera.
- **Note personalizzate tra un passo e l'altro**: il `＋` in ogni spazio apre il pannello di quel punto; le note compaiono inline in viola, con aggiunta, modifica ed eliminazione. Restano anche con “Nuova partita” e sono segnalate da un puntino viola sullo stepper.
- **Interfaccia bilingue IT/EN**: il pulsante in alto a destra alterna italiano e inglese (scelta ricordata). Sono tradotti anche fasi, processi, passi del regolamento, cronologia e messaggi dei popup. La lingua iniziale segue `?lang=`, poi la preferenza salvata, poi quella del browser.
- **Nomi delle fasi sullo stepper del tablet**: con spazio a disposizione ogni pulsante 1–7 mostra numero e nome.
- **AVANTI** avanza la fase; dal Ristoro fa partire il turno successivo (`Turno+1`, `Minaccia+1` a tutti i giocatori, di nuovo Risorsa).
- **Minaccia in rosso da 50 in su**.
- **Undo** a 30 passi: annulla tap sbagliati, cambi fase, avanzamenti e anche il reset.
- **Ruota interfaccia** con il tasto `↻`: passa tra verticale e orizzontale, utile col telefono appoggiato o fissato a un supporto. La scelta viene ricordata.
- **Blocco schermo on/off**: il badge in alto è un interruttore; la preferenza viene salvata.
- **Suoni**: `tap.mp3` a ogni pulsante, `undo.mp3` quando annulli un'azione, `new-round.mp3` quando dal Ristoro parte il turno successivo.
- Stato, fase, segnalibro, lingua, note e cronologia salvati in `localStorage`: riaprendo ritrovi la partita dov'era. Le note sopravvivono a “Nuova partita”.
- **PWA installabile e offline first** (manifest + service worker): dopo il primo caricamento funziona anche senza rete. La versione è mostrata accanto al brand.

## Prova in locale

```bash
python3 -m http.server 8080
# poi apri http://localhost:8080
```

Servono HTTP e non `file://`, altrimenti il manifest e (su alcuni browser) il wake lock non funzionano.

## Deploy su GitHub Pages

1. Crea un repository e carica tutti i file nella radice di `main`.
2. Repository → **Settings** → **Pages**.
3. *Build and deployment* → Source: **Deploy from a branch** → Branch: `main`, cartella `/ (root)` → **Save**.
4. Dopo un minuto l'app è su `https://<utente>.github.io/<repo>/`.

Tutti i percorsi sono relativi, quindi funziona sia come sito "root" sia come sottocartella di progetto.

## Personalizzazione

I testi stanno in `i18n.js`, la logica e la struttura in `app.js`, la versione in `version.js`:

- `version.js`: `self.APP_VERSION` è l'unica fonte di verità per la versione mostrata e per la cache del service worker.
- `i18n.js`: dizionari `it` e `en` (nomi delle fasi, dei processi, testi dei passi, interfaccia, cronologia). Le chiavi dei passi sono gli id stabili usati da note e segnalibro.
- `FASI`: per ogni fase i blocchi, creati con `step("1.1")` e `actionWindow("w-1")`; il testo arriva da `i18n.js` tramite l'id.
- `PROCESSI`: i due processi di combattimento mostrati nei popup (passi e finestre di azione).
- `initialState()`: stato di partenza (`turno: 1`, `fase: 0`, un solo giocatore con `threat: 30` e `setup: false`).
- `PLAYER_LIMIT` (4) e `PLAYER_NAME_MAX` (18): numero massimo di giocatori e lunghezza del nome.
- `HISTORY_LIMIT`: quanti passaggi di undo conservare.
- `THREAT_ALERT`: soglia (50) oltre la quale la Minaccia diventa rossa.
- `THREAT_MAX`: valore massimo impostabile per la Minaccia (999).
- `NOTE_LIMIT`: lunghezza massima di una nota (240 caratteri).
- `sfx`: file audio e volumi (`tap` 0.45, `undo` 0.7, `round` 0.9). I file `tap.mp3`, `undo.mp3` e `new-round.mp3` stanno nella radice del progetto.

## Giocatori e modalità tablet

- La modalità tablet si attiva da sola quando il **lato corto** dello schermo è almeno **600 px**: vale in verticale, in orizzontale e anche con la rotazione dell'interfaccia. Sotto quella soglia l'app resta identica alla versione per telefono.
- Su tablet compaiono fino a 4 card Minaccia (più il Turno), disposte in una griglia che va a capo. Il tasto `＋` aggiunge un giocatore (disabilitato a 4), la `×` lo rimuove (solo con almeno 2).
- Toccando il nome si apre il dialog per rinominare il giocatore; un nome vuoto torna a “Giocatore N”.
- Sul telefono si vede solo il giocatore 1, con l'etichetta “Minaccia · Nome” se il nome è impostato. I nomi si gestiscono dal tablet.
- I dati sono in `state.players`: `[{ id, name, threat, setup }]`. `setup` è il promemoria della Minaccia iniziale del singolo giocatore.
- I salvataggi della 1.0.0 (campo `minaccia` singolo) vengono migrati automaticamente al primo giocatore al primo avvio.

Le note sono salvate nello stesso documento `localStorage` sotto `notes`, indicizzate per contenitore e spazio: `"0::1.3"` = dopo il passo 1.3 della fase Risorsa, `"0::end"` = fine fase, `"proc:nemici::6.4.1"` = dopo 6.4.1 nel processo degli attacchi dei nemici. I salvataggi del vecchio formato (note per fase) vengono migrati automaticamente a fine fase. Non fanno parte dello stato di gioco, quindi non vengono azzerate da “Nuova partita” né toccate dall'undo.

## Segnalibro

- C'è **un solo segnalibro**: tocca un passo (numero o testo) oppure il nastro a destra per segnarlo; tocca di nuovo lo stesso passo per rimuoverlo, o un altro passo per spostarlo. I pulsanti “Apri il processo” non lo attivano.
- Vale per i passi delle fasi e per quelli dei processi di combattimento (6.4.x e 6.8.x): in quel caso il puntino compare sulla fase 6.
- La riga segnata ha una barra dorata; sullo stepper il segnalibro è il puntino **giallo** in basso a destra, mentre le note restano il puntino **viola** in alto a destra.
- È salvato in `state.bookmark` (`{ container, step }`), quindi resta tra le sessioni; “Nuova partita” lo azzera e Annulla lo ripristina. Come le note, non occupa un passaggio della cronologia.

## Lingua

- Il pulsante in alto a destra mostra la lingua attiva (`IT` o `EN`) e al tocco passa all'altra; la scelta è salvata.
- Ordine di scelta all'avvio: parametro `?lang=en` (utile per i test), poi la lingua salvata, poi `navigator.languages`, infine l'italiano.
- Le traduzioni inglesi sono una prima stesura: i testi del regolamento vanno rifiniti sulla terminologia ufficiale. Per correggere basta modificare `i18n.js`.
- Per aggiungere una lingua serve una nuova voce in `self.I18N` e una in `self.I18N_LANG_NAMES`: il pulsante la include automaticamente nel ciclo.

Lo stile (tema scuro/oro) è in `styles.css`, variabili CSS in `:root`.

## Versione, changelog e ciclo di rilascio

Le modifiche di ogni rilascio sono elencate in [`CHANGELOG.md`](./CHANGELOG.md);
qui sotto le regole per aggiornarlo insieme alla versione.

### Dove sta la versione

La versione ha una sola fonte di verità: **`version.js`**

```js
self.APP_VERSION = "1.2.0";
```

Da lì:

- `app.js` la mostra accanto al brand (`LOTR LCG v1.2.0`);
- `sw.js` la usa per il nome della cache (`lotr-lcg-v1.2.0`).

Non scrivere il numero di versione in altri file: si cambia solo `version.js` e
tutto il resto si aggiorna di conseguenza.

### Numeri di versione (Semantic Versioning)

- **MAJOR** (`2.0.0`): modifiche che rompono i salvataggi esistenti (formato di
  `localStorage`, note, cronologia) o cambiano radicalmente il modo d'uso.
- **MINOR** (`1.1.0`): nuove funzioni retrocompatibili.
- **PATCH** (`1.2.1`): correzioni di bug e ritocchi, senza nuove funzioni.

### Quando aggiornare la versione

Va aggiornata **a ogni rilascio che modifica file messi in cache**:
`index.html`, `styles.css`, `app.js`, `version.js`, `manifest.webmanifest`,
icone e audio.

Il service worker serve quei file dalla cache: senza il bump, un telefono con
l'app già installata può continuare a mostrare la versione vecchia.

Non serve per modifiche solo a `README.md`, `CHANGELOG.md` o `.nojekyll`, che
non fanno parte del precache.

### Ciclo di rilascio

1. Completa le modifiche e provale in locale (`python3 -m http.server`).
2. Aggiorna `version.js` con il nuovo numero.
3. Aggiungi la voce in `CHANGELOG.md` (data ISO, sezioni `Added`, `Changed`,
   `Fixed`, `Removed`; sposta lì eventuali voci da `[Unreleased]`).
4. Commit delle modifiche sul branch di lavoro.
5. Porta le modifiche sul branch che GitHub Pages pubblica (nel setup qui sopra
   `main`), ad esempio con un merge da `develop`.
6. Crea il **tag annotato** sul commit che vuoi pubblicare, dal terminale:

   ```bash
   git tag -a v1.2.1 -m "v1.2.1"
   ```

7. Pusha commit e tag:

   ```bash
   git push origin main
   git push origin v1.2.1
   # oppure, se il branch è tracciato:
   git push --follow-tags
   ```

8. Su GitHub: **Releases → Draft a new release**, scegli il tag appena pushato,
   incolla la sezione corrispondente del changelog e pubblica. Pages ridistribuisce
   da solo il branch.

Il tag si crea **in locale** e si pusha con `git push`: non serve un pulsante
speciale. In alternativa si può creare dalla UI:

- **GitHub**: Releases → *Draft a new release* → *Choose a tag* → *Create new tag*;
- **GitLab**: Repository → *Tags* → *New tag*, oppure Releases → *New release*.

In tutti i casi il tag deve puntare **esattamente al commit che viene
pubblicato**, e deve essere annotato (`-a`) così conserva autore e messaggio.
Per controllare: `git show v1.2.1` e, nell'app, la scritta accanto al brand.

### Rollback

Non riusare mai un numero di versione già pubblicato: alcuni browser e la cache
del service worker potrebbero confonderlo con quello vecchio.

Per tornare indietro:

1. ripristina il codice con `git revert` del commit problematico (o riparti dal
   tag precedente con un nuovo commit);
2. bumpa una **PATCH** (es. `1.2.1`);
3. aggiungi la voce in `CHANGELOG.md` e ripeti il ciclo di rilascio.

### Verifica rapida

- Brand in alto: deve mostrare il numero appena rilasciato.
- DevTools → *Application → Service Workers*: worker attivo.
- DevTools → *Application → Cache Storage*: una sola cache, `lotr-lcg-v<versione>`;
  le cache delle versioni precedenti vengono eliminate all'attivazione.

## Installazione e uso offline

- Servi l'app via **HTTPS** (GitHub Pages va bene) o `localhost`: il service worker non funziona da `file://`.
- Al primo caricamento vengono messi in cache HTML, CSS, JS, icone e audio. Da quel momento l'app si apre e funziona anche in modalità aereo.
- Android/Chrome: menu → “Installa app” (o il prompt automatico). iOS/Safari: Condividi → “Aggiungi alla schermata Home”.
- Aggiornamenti: bump di `version.js`; l'app installata si aggiorna automaticamente alla riapertura.
- Se modifichi i file in locale e non vedi le modifiche, bumpa la versione o svuota i dati del sito.

## Note su popup e tastiera

- I popup si aprono **in alto**, non più centrati.
- L'altezza dell'overlay segue l'area visibile (`visualViewport`): quando si apre la tastiera, il campo note e il pulsante “Aggiungi” restano sopra la tastiera.
- La stessa logica funziona con l'interfaccia ruotata a 90° (assi scambiati).

## Note sul blocco schermo

Il badge in alto a destra è un **interruttore**:

- **● Schermo attivo** — blocco acquisito; un tocco lo spegne.
- **○ Schermo spento** — nessun blocco; un tocco lo riattiva.
- **⚠ Non supportato** — il browser non espone la Screen Wake Lock API.

La preferenza è salvata, quindi se lo spegni resta spento anche dopo un ricaricamento; se è attivo, viene riacquisito automaticamente quando torni sull'app. Il wake lock è supportato da Chrome/Edge/Firefox recenti e Safari 16.4+. Su iOS conviene **aggiungere l'app alla schermata Home** e aprirla da lì: in molti casi è l'unico modo perché il blocco funzioni.

## Note sulla rotazione

- Ruota **solo l'interfaccia**, non lo schermo del sistema: status bar e tasti fisici restano dove sono. È l'unico modo possibile da una pagina web (la Screen Orientation API funziona solo in fullscreen su Android e non esiste su iOS).
- Il tasto alterna soltanto **verticale (0°) e orizzontale (90°)**; non ci sono le rotazioni capovolte, che non servono con il telefono appoggiato o montato su un supporto.
- In orizzontale larghezza e altezza logiche si scambiano: l'interfaccia si compatta per restare interamente visibile.
- L'interfaccia ha altezza fissa in ogni orientamento: stepper delle fasi e AVANTI non si spostano quando cambiano descrizione o note; se il contenuto della fase è troppo alto scorre solo quello. In landscape (altezze sotto 480px logici) i comandi si compattano per restare tutti visibili, senza rendere scorrevole la pagina.
- La rotazione scelta è persistita in `localStorage`.
- Le dimensioni dell'interfaccia sono calcolate in pixel dal viewport e riallineate dopo fullscreen e cambi di orientamento: su Android il viewport può aggiornarsi in ritardo e con le unità `vw/dvh` la rotazione in fullscreen poteva risultare “widescreen” con le fasi schiacciate.

## Note su audio e schermo intero

- I browser permettono l'audio solo dopo un gesto dell'utente: sia il tap sia il suono di nuovo turno partono da un tocco, quindi vengono riprodotti correttamente. Se non senti nulla controlla il volume del telefono e l'interruttore del silenzioso.
- Il volume degli effetti è impostato in `app.js` (`sfx`); puoi sostituire `tap.mp3`, `undo.mp3` e `new-round.mp3` mantenendo gli stessi nomi. Il tasto Annulla usa solo `undo.mp3`, senza il tap generico sovrapposto.
- Lo schermo intero è **disattivato**: il pulsante `⛶` è stato sostituito dal selettore di lingua. Il markup è commentato in `index.html` e il codice in `app.js` è protetto da `if (el.fullscreenBtn)`, quindi riattivarlo richiede solo di togliere il commento (e rimettere il pulsante al posto o accanto a `langBtn`). La Fullscreen API era applicata alla radice della pagina, non al contenitore ruotato, così la rotazione restava attiva anche in fullscreen.

## Struttura

```
index.html
styles.css
app.js
i18n.js
version.js
sw.js
manifest.webmanifest
icon.svg  icon-192.png  icon-512.png
bookmark.svg  bookmark-filled.svg  pencil-1.svg  trash.svg
reload.svg  reset.svg  update.svg
cross-2.svg  plus.svg
enter-full-screen.svg  exit-full-screen.svg
tap.mp3  undo.mp3  new-round.mp3
CHANGELOG.md
README.md
.gitignore
.nojekyll
```

Le icone dell'interfaccia sono [Radix Icons](https://www.radix-ui.com/icons) (MIT): in root ci sono solo gli SVG usati, mentre la cartella completa `icons/` è esclusa da `.gitignore`.
