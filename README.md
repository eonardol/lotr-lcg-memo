# Turno · LOTR LCG

Webapp leggera di supporto per **Il Signore degli Anelli LCG** (solitario), pensata per il telefono.

- **Turno** e **Minaccia** con pulsanti `−` / `+` (pressione prolungata per scorrere veloce).
- Tap sul numero della Minaccia per impostarla a un valore qualsiasi (default 30).
- **Tracker delle 7 fasi** con tutti i passi numerati del regolamento (1.1, 1.2, …) e le **finestre di azione** evidenziate in rosso.
- **Processi di combattimento in popup**: “Risolvere gli Attacchi dei Nemici” e “Risolvere gli Attacchi dei Giocatori”, apribili dai passi 6.4a e 6.8a.
- **Note personalizzate tra un passo e l'altro**: il `＋` in ogni spazio apre il pannello di quel punto; le note compaiono inline in viola, con aggiunta, modifica ed eliminazione. Restano anche con “Nuova partita” e sono segnalate da un puntino sullo stepper.
- **AVANTI** avanza la fase; dal Ristoro fa partire il turno successivo (`Turno+1`, `Minaccia+1`, di nuovo Risorsa).
- **Minaccia in rosso da 50 in su**.
- **Undo** a 30 passi: annulla tap sbagliati, cambi fase, avanzamenti e anche il reset.
- **Ruota interfaccia** con il tasto `↻`: passa tra verticale e orizzontale, utile col telefono appoggiato o fissato a un supporto. La scelta viene ricordata.
- **Schermo intero** con il tasto `⛶` accanto alla rotazione (dove il browser lo supporta).
- **Blocco schermo on/off**: il badge in alto è un interruttore; la preferenza viene salvata.
- **Suoni**: `tap.mp3` a ogni pulsante, `new-round.mp3` quando dal Ristoro parte il turno successivo.
- Stato, fase, note e cronologia salvati in `localStorage`: riaprendo ritrovi la partita dov'era. Le note sopravvivono a “Nuova partita”.
- PWA installabile (manifest + icone), nessuna dipendenza esterna, funziona sotto qualsiasi sottocartella.

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

Tutto sta in `app.js`:

- `FASI`: per ogni fase il nome e i blocchi, creati con `step("1.1", "…")` e `actionWindow("w-1")`.
- `PROCESSI`: i due processi di combattimento mostrati nei popup (passi e finestre di azione).
- `initialState()`: valori di partenza (`turno: 1`, `minaccia: 30`, `fase: 0`).
- `HISTORY_LIMIT`: quanti passaggi di undo conservare.
- `THREAT_ALERT`: soglia (50) oltre la quale la Minaccia diventa rossa.
- `NOTE_LIMIT`: lunghezza massima di una nota (240 caratteri).
- `sfx`: file audio e volumi (`tap` 0.45, `round` 0.9). I file `tap.mp3` e `new-round.mp3` stanno nella radice del progetto.

Le note sono salvate nello stesso documento `localStorage` sotto `notes`, indicizzate per contenitore e spazio: `"0::1.3"` = dopo il passo 1.3 della fase Risorsa, `"0::end"` = fine fase, `"proc:nemici::6.4.1"` = dopo 6.4.1 nel processo degli attacchi dei nemici. I salvataggi del vecchio formato (note per fase) vengono migrati automaticamente a fine fase. Non fanno parte dello stato di gioco, quindi non vengono azzerate da “Nuova partita” né toccate dall'undo.

Lo stile (tema scuro/oro) è in `styles.css`, variabili CSS in `:root`.

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

## Note su audio e schermo intero

- I browser permettono l'audio solo dopo un gesto dell'utente: sia il tap sia il suono di nuovo turno partono da un tocco, quindi vengono riprodotti correttamente. Se non senti nulla controlla il volume del telefono e l'interruttore del silenzioso.
- Il volume dei due effetti è impostato in `app.js` (`sfx`); puoi sostituire i file `tap.mp3` e `new-round.mp3` mantenendo gli stessi nomi.
- Il tasto `⛶` usa la Fullscreen API sulla radice della pagina (non sul contenitore ruotato: i browser annullano la trasformazione dell'elemento fullscreen) e diventa “esci” quando sei a schermo intero. La rotazione resta quindi attiva anche in fullscreen. Su iPhone Safari la Fullscreen API per gli elementi non è disponibile: in quel caso il tasto viene nascosto.

## Struttura

```
index.html
styles.css
app.js
manifest.webmanifest
icon.svg  icon-192.png  icon-512.png
tap.mp3  new-round.mp3
.nojekyll
```
