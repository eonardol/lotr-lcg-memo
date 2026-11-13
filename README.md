# Turno · LOTR LCG

Webapp leggera di supporto per **Il Signore degli Anelli LCG** (solitario), pensata per il telefono.

- **Turno** e **Minaccia** con pulsanti `−` / `+` (pressione prolungata per scorrere veloce).
- Tap sul numero della Minaccia per impostarla a un valore qualsiasi (default 30).
- **Tracker delle 7 fasi** con promemoria: Risorsa, Pianificazione, Impresa, Viaggio, Incontro, Combattimento, Ristoro.
- **Note personalizzate per fase**: più note per fase, con aggiunta, modifica ed eliminazione. Restano visibili sotto la descrizione e sono segnalate da un puntino sullo stepper.
- **AVANTI** avanza la fase; dal Ristoro fa partire il turno successivo (`Turno+1`, `Minaccia+1`, di nuovo Risorsa).
- **Minaccia in rosso da 50 in su**.
- **Undo** a 30 passi: annulla tap sbagliati, cambi fase, avanzamenti e anche il reset.
- Stato, fase, note e cronologia salvati in `localStorage`: riaprendo ritrovi la partita dov'era. Le note sopravvivono a “Nuova partita”.
- **Wake lock**: prova a tenere lo schermo acceso, con riattivazione automatica al ritorno sull'app.
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

- `PHASES`: nomi e descrizioni delle fasi.
- `initialState()`: valori di partenza (`turno: 1`, `minaccia: 30`, `fase: 0`).
- `HISTORY_LIMIT`: quanti passaggi di undo conservare.
- `THREAT_ALERT`: soglia (50) oltre la quale la Minaccia diventa rossa.
- `NOTE_LIMIT`: lunghezza massima di una nota (240 caratteri).

Le note sono salvate nello stesso documento `localStorage` sotto `notes`, indicizzate per numero di fase (`"0"` = Risorsa, `"2"` = Impresa, …). Non fanno parte dello stato di gioco, quindi non vengono azzerate da “Nuova partita” né toccate dall'undo.

Lo stile (tema scuro/oro) è in `styles.css`, variabili CSS in `:root`.

## Note sul blocco schermo

Il wake lock è supportato da Chrome/Edge/Firefox recenti e Safari 16.4+. Su iOS conviene **aggiungere l'app alla schermata Home** e aprirla da lì: in molti casi è l'unico modo perché il blocco funzioni. Il badge in alto a destra mostra lo stato:

- **Schermo attivo** — blocco acquisito.
- **Tocca per attivare** — supportato ma non ancora attivo: basta toccare lo schermo.
- **Schermo non bloccato** — API non disponibile nel browser.

## Struttura

```
index.html
styles.css
app.js
manifest.webmanifest
icon.svg  icon-192.png  icon-512.png
.nojekyll
```
