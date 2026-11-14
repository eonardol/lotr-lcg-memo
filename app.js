(() => {
  "use strict";

  const APP_VERSION =
    typeof self.APP_VERSION === "string" && self.APP_VERSION ? self.APP_VERSION : "dev";

  const step = (id, text, options) => ({ id, kind: "step", text, ...options });
  const actionWindow = (id) => ({ id, kind: "window" });

  // Passi esatti del regolamento. `id` è anche l'ancora delle note:
  // una nota agganciata a "1.3" compare tra 1.3 e il blocco successivo.
  // "end" è la posizione finale della fase/processo.
  const FASI = [
    {
      name: "Risorsa",
      blocks: [
        step("1.1", "Inizio della Fase di Risorsa"),
        step("1.2", "Riscuotere risorse"),
        step("1.3", "Pescare carte"),
        actionWindow("w-1"),
        step("1.4", "Fine della Fase di Risorsa"),
      ],
    },
    {
      name: "Pianificazione",
      blocks: [
        step("2.1", "Inizio della Fase di Pianificazione"),
        step(
          "2.2",
          "Finestra di azione speciale (il giocatore attivo può giocare anche alleati e aggiunte)"
        ),
        step(
          "2.3",
          "Il giocatore successivo (in ordine di gioco) diventa il giocatore attivo (tornare a 2.2 o proseguire con 2.4)"
        ),
        step("2.4", "Fine della Fase di Pianificazione"),
      ],
    },
    {
      name: "Impresa",
      blocks: [
        step("3.1", "Inizio della Fase di Impresa"),
        actionWindow("w-1"),
        step("3.2", "Destinare i personaggi"),
        actionWindow("w-2"),
        step("3.3", "Allestimento"),
        actionWindow("w-3"),
        step("3.4", "Risoluzione dell'impresa"),
        actionWindow("w-4"),
        step("3.5", "Fine della Fase di Impresa"),
      ],
    },
    {
      name: "Viaggio",
      blocks: [
        step("4.1", "Inizio della Fase di Viaggio"),
        step("4.2", "Opportunità di viaggio"),
        actionWindow("w-1"),
        step("4.3", "Fine della Fase di Viaggio"),
      ],
    },
    {
      name: "Incontro",
      blocks: [
        step("5.1", "Inizio della Fase di Incontro"),
        step("5.2", "Impegno facoltativo"),
        actionWindow("w-1"),
        step("5.3", "Verifiche di impegno"),
        actionWindow("w-2"),
        step("5.4", "Fine della Fase di Incontro"),
      ],
    },
    {
      name: "Combattimento",
      blocks: [
        step("6.1", "Inizio della Fase di Combattimento"),
        step("6.2", "Distribuire le carte ombra"),
        actionWindow("w-1"),
        step("6.3", "Inizio del processo “Risolvere gli Attacchi dei Nemici”"),
        step(
          "6.4a",
          "Il giocatore attivo risolve l'attacco del nemico successivo. Ripetere questo passo finché tutti i nemici validi di quel giocatore non hanno attaccato",
          { process: "nemici" }
        ),
        step(
          "6.5",
          "Il giocatore successivo diventa il giocatore attivo (tornare a 6.4a). Se tutti i giocatori hanno risolto gli attacchi dei nemici, proseguire con 6.6"
        ),
        step("6.6", "Fine del processo “Risolvere gli Attacchi dei Nemici”"),
        step("6.7", "Inizio del processo “Risolvere gli Attacchi dei Giocatori”"),
        step(
          "6.8a",
          "Il giocatore attivo dichiara l'attacco successivo. Ripetere questo passo finché tutti gli attacchi validi di quel giocatore non sono stati effettuati",
          { process: "giocatori" }
        ),
        step(
          "6.9",
          "Il giocatore successivo diventa il giocatore attivo (tornare a 6.8a). Se tutti i giocatori hanno risolto gli attacchi dei giocatori, proseguire con 6.10"
        ),
        step("6.10", "Fine del processo “Risolvere gli Attacchi dei Giocatori”"),
        step("6.11", "Fine della Fase di Combattimento. Scartare tutte le carte ombra"),
      ],
    },
    {
      name: "Ristoro",
      blocks: [
        step("7.1", "Inizio della Fase di Ristoro"),
        step("7.2", "Ripristinare le carte"),
        step("7.3", "Aumentare la Minaccia (viene fatto in automatico da questa app)"),
        step("7.4", "Passare il segnalino primo giocatore"),
        actionWindow("w-1"),
        step("7.5", "Fine della Fase di Ristoro"),
      ],
    },
  ];

  // Processi di combattimento mostrati nei popup, a partire dai passi 6.3 e 6.7.
  const PROCESSI = {
    nemici: {
      name: "Risolvere gli Attacchi dei Nemici",
      blocks: [
        step("6.4b", "Lancio dell'attacco del nemico (il giocatore attivo sceglie il nemico)"),
        actionWindow("w-1"),
        step("6.4.1", "Dichiarare il difensore"),
        actionWindow("w-2"),
        step("6.4.2", "Risolvere l'effetto di ombra"),
        actionWindow("w-3"),
        step("6.4.3", "Determinare i danni da combattimento"),
        actionWindow("w-4"),
        step(
          "6.4.4",
          "Fine dell'attacco del nemico. Se il giocatore attivo deve risolvere altri attacchi dei nemici, ritornare a 6.4a. Altrimenti, proseguire con 6.5"
        ),
      ],
    },
    giocatori: {
      name: "Risolvere gli Attacchi dei Giocatori",
      blocks: [
        step(
          "6.8b",
          "Lancio dell'attacco del giocatore (il giocatore attivo dichiara bersaglio dell'attacco e attaccante/i)"
        ),
        step("6.8.1", "Opzione Distanza"),
        actionWindow("w-1"),
        step("6.8.2", "Determinare la Forza di Attacco"),
        actionWindow("w-2"),
        step("6.8.3", "Determinare i danni da combattimento"),
        actionWindow("w-3"),
        step(
          "6.8.4",
          "Fine dell'attacco del giocatore. Se il giocatore attivo deve risolvere altri attacchi del giocatore, ritornare a 6.8a. Altrimenti, proseguire con 6.9"
        ),
      ],
    },
  };

  const STORAGE_KEY = "lotr-lcg-memo/v1";
  const HISTORY_LIMIT = 30;
  const NOTE_LIMIT = 240;
  const NOTES_PER_GAP = 30;
  const THREAT_ALERT = 50;
  const LAST_PHASE = FASI.length - 1;
  // Fase di Combattimento: i suoi processi condividono il pallino delle note.
  const PROCESSI_FASE = { 5: ["nemici", "giocatori"] };

  const $ = (id) => document.getElementById(id);

  const el = {
    rotator: $("rotator"),
    rotateBtn: $("rotateBtn"),
    fullscreenBtn: $("fullscreenBtn"),
    wakeBadge: $("wakeBadge"),
    wakeText: $("wakeText"),
    appVersion: $("appVersion"),
    turnoValue: $("turnoValue"),
    minacciaValue: $("minacciaValue"),
    threatCounter: $("threatCounter"),
    threatHint: $("threatHint"),
    turnoMinus: $("turnoMinus"),
    turnoPlus: $("turnoPlus"),
    minacciaMinus: $("minacciaMinus"),
    minacciaPlus: $("minacciaPlus"),
    stepper: $("stepper"),
    phaseNum: $("phaseNum"),
    phaseName: $("phaseName"),
    phaseCard: $("phaseCard"),
    phaseSteps: $("phaseSteps"),
    next: $("next"),
    nextHint: $("nextHint"),
    undo: $("undo"),
    undoLabel: $("undoLabel"),
    reset: $("reset"),
    processOverlay: $("processOverlay"),
    processTitle: $("processTitle"),
    processClose: $("processClose"),
    processList: $("processList"),
    notesOverlay: $("notesOverlay"),
    notesTitle: $("notesTitle"),
    notesSub: $("notesSub"),
    notesClose: $("notesClose"),
    notesList: $("notesList"),
    notesEmpty: $("notesEmpty"),
    notesForm: $("notesForm"),
    notesInput: $("notesInput"),
    notesCount: $("notesCount"),
    notesAdd: $("notesAdd"),
    threatOverlay: $("threatOverlay"),
    threatInput: $("threatInput"),
    threatConfirm: $("threatConfirm"),
    threatCancel: $("threatCancel"),
    resetOverlay: $("resetOverlay"),
    resetConfirm: $("resetConfirm"),
    resetCancel: $("resetCancel"),
  };

  const initialState = () => ({
    turno: 1,
    minaccia: 30,
    fase: 0,
    threatSetup: false,
  });

  /* ---------- audio ---------- */

  function makeSound(src, volume) {
    const audio = new Audio(src);
    audio.preload = "auto";
    audio.volume = volume;
    return audio;
  }

  const sfx = {
    tap: makeSound("./tap.mp3", 0.45),
    round: makeSound("./new-round.mp3", 0.9),
  };

  function playSfx(name) {
    const audio = sfx[name];
    if (!audio) return;
    try {
      audio.currentTime = 0;
    } catch (error) {
      /* metadati non ancora caricati: play parte comunque dall'inizio */
    }
    try {
      const playback = audio.play();
      if (playback && typeof playback.catch === "function") {
        playback.catch(() => {});
      }
    } catch (error) {
      /* audio non disponibile: si continua senza suono */
    }
  }

  let state = initialState();
  let history = [];
  let notes = {};
  let rotation = 0;
  let wakeWanted = true;
  let editingNoteId = null;
  let deletingNoteId = null;
  let lastRendered = null;
  let noteScope = null;
  let activeProcess = null;
  let notesVersion = 0;
  let renderedPhaseKey = null;
  let renderedProcessKey = null;
  const overlayStack = [];
  const overlayFocus = new Map();

  /* ---------- persistence ---------- */

  function sanitize(raw) {
    const turno = Math.floor(Number(raw && raw.turno));
    const minaccia = Math.floor(Number(raw && raw.minaccia));
    const fase = Math.floor(Number(raw && raw.fase));
    const threatSetup =
      raw && typeof raw.threatSetup === "boolean" ? raw.threatSetup : true;
    return {
      turno: Number.isFinite(turno) ? Math.max(1, turno) : 1,
      minaccia: Number.isFinite(minaccia) ? Math.max(0, minaccia) : 30,
      fase: Number.isFinite(fase) ? Math.min(LAST_PHASE, Math.max(0, fase)) : 0,
      // I salvataggi della versione precedente non hanno il flag:
      // li consideriamo già impostati per non disturbare una partita in corso.
      threatSetup,
    };
  }

  function makeId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function isProcessContainer(container) {
    return container.startsWith("proc:");
  }

  function blocksFor(container) {
    if (isProcessContainer(container)) {
      const process = PROCESSI[container.slice(5)];
      return process ? process.blocks : [];
    }
    const phase = FASI[Number(container)];
    return phase ? phase.blocks : [];
  }

  function containerTitle(container) {
    if (isProcessContainer(container)) {
      const process = PROCESSI[container.slice(5)];
      return process ? process.name : "Processo";
    }
    const phase = FASI[Number(container)];
    return phase ? phase.name : "Fase";
  }

  function isKnownContainer(container) {
    if (isProcessContainer(container)) return !!PROCESSI[container.slice(5)];
    return /^\d+$/.test(container) && FASI[Number(container)] !== undefined;
  }

  // Le note stanno "tra" due blocchi: l'ancora è l'id del blocco che precede
  // lo spazio, oppure "end" per lo spazio finale.
  function validAnchors(container) {
    const anchors = new Set(["end"]);
    blocksFor(container)
      .slice(0, -1)
      .forEach((block) => anchors.add(block.id));
    return anchors;
  }

  function noteKey(container, anchor) {
    return `${container}::${anchor}`;
  }

  function getNotes(container, anchor) {
    return notes[noteKey(container, anchor)] || [];
  }

  function gapLabel(container, anchor) {
    const blocks = blocksFor(container);
    const finale = isProcessContainer(container) ? "Fine del processo" : "Fine della fase";
    if (anchor === "end") return finale;

    const index = blocks.findIndex((block) => block.id === anchor);
    if (index === -1) return finale;

    const next = blocks[index + 1];
    if (!next) return finale;

    const label = (block) => (block.kind === "window" ? "la finestra di azione" : block.id);
    return `Tra ${label(blocks[index])} e ${label(next)}`;
  }

  function phaseHasNotes(index) {
    const prefixes = [`${index}::`];
    (PROCESSI_FASE[index] || []).forEach((kind) => prefixes.push(`proc:${kind}::`));
    return Object.keys(notes).some((key) =>
      prefixes.some((prefix) => key.startsWith(prefix))
    );
  }

  function sanitizeNotes(raw) {
    const clean = {};
    if (!raw || typeof raw !== "object") return clean;

    const add = (key, value) => {
      if (!Array.isArray(value)) return;
      const split = key.indexOf("::");
      // Formato vecchio ({"0": [...]}) e nuovo ({"0::1.3": [...]})
      const container = split === -1 ? key : key.slice(0, split);
      const anchor = split === -1 ? "end" : key.slice(split + 2);
      if (!isKnownContainer(container) || !validAnchors(container).has(anchor)) return;

      const list = value
        .filter((note) => note && typeof note.text === "string")
        .map((note) => ({
          id: typeof note.id === "string" && note.id ? note.id : makeId(),
          text: note.text.slice(0, NOTE_LIMIT).trim(),
        }))
        .filter((note) => note.text.length > 0)
        .slice(0, NOTES_PER_GAP);

      if (list.length > 0) clean[noteKey(container, anchor)] = list;
    };

    Object.entries(raw).forEach(([key, value]) => add(key, value));
    return clean;
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (!data || typeof data !== "object") return;
      if (data.state) state = sanitize(data.state);
      if (Array.isArray(data.history)) {
        history = data.history
          .filter((entry) => entry && entry.state && typeof entry.label === "string")
          .slice(-HISTORY_LIMIT)
          .map((entry) => ({ state: sanitize(entry.state), label: entry.label }));
      }
      notes = sanitizeNotes(data.notes);
      if (typeof data.wake === "boolean") wakeWanted = data.wake;
      // Solo due stati: verticale (0) e orizzontale (90).
      // I vecchi salvataggi a 270 vengono riportati a 90, 180 a 0.
      if ([90, 270].includes(Number(data.rotation))) {
        rotation = 90;
      }
    } catch (error) {
      /* storage non disponibile: si continua senza persistenza */
    }
  }

  function save() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ state, history, notes, wake: wakeWanted, rotation })
      );
    } catch (error) {
      /* quota o modalità privata: ignorato */
    }
  }

  /* ---------- helpers ---------- */

  function vibrate(ms) {
    if (navigator.vibrate) {
      try {
        navigator.vibrate(ms);
      } catch (error) {
        /* ignorato */
      }
    }
  }

  function pop(node) {
    node.classList.remove("pop");
    void node.offsetWidth;
    node.classList.add("pop");
  }

  function snapshot(label) {
    return { state: { ...state }, label };
  }

  function trimHistory() {
    if (history.length > HISTORY_LIMIT) {
      history = history.slice(-HISTORY_LIMIT);
    }
  }

  function mutate(label, apply) {
    history.push(snapshot(label));
    trimHistory();
    apply();
    state = sanitize(state);
    save();
    render();
  }

  /* ---------- render ---------- */

  function render() {
    const faseChanged = !lastRendered || lastRendered.fase !== state.fase;
    const turnoChanged = !lastRendered || lastRendered.turno !== state.turno;
    const minacciaChanged = !lastRendered || lastRendered.minaccia !== state.minaccia;

    el.turnoValue.textContent = String(state.turno);
    el.minacciaValue.textContent = String(state.minaccia);
    el.turnoValue.classList.toggle("long", String(state.turno).length > 2);
    el.minacciaValue.classList.toggle("long", String(state.minaccia).length > 2);
    const needsSetup = !state.threatSetup;
    el.threatCounter.classList.toggle("needs-setup", needsSetup);
    el.threatHint.textContent = needsSetup
      ? "Imposta la minaccia iniziale"
      : "tocca il numero per impostarlo";
    el.minacciaValue.setAttribute(
      "aria-label",
      `Minaccia ${state.minaccia}${state.minaccia >= THREAT_ALERT ? ", livello di allarme" : ""}${
        needsSetup ? ", valore iniziale da impostare" : ""
      }. Tocca per impostare un valore`
    );
    el.minacciaValue.classList.toggle("alert", state.minaccia >= THREAT_ALERT);
    el.turnoMinus.disabled = state.turno <= 1;
    el.minacciaMinus.disabled = state.minaccia <= 0;

    if (turnoChanged && lastRendered) pop(el.turnoValue);
    if (minacciaChanged && lastRendered) pop(el.minacciaValue);

    Array.from(el.stepper.children).forEach((pill, index) => {
      const current = index === state.fase;
      pill.classList.toggle("current", current);
      pill.classList.toggle("done", index < state.fase);
      pill.classList.toggle("has-notes", phaseHasNotes(index));
      if (current) {
        pill.setAttribute("aria-current", "step");
      } else {
        pill.removeAttribute("aria-current");
      }
    });

    const phase = FASI[state.fase];
    el.phaseNum.textContent = String(state.fase + 1);
    el.phaseName.textContent = phase.name;
    renderPhaseBlocks();
    if (faseChanged) el.phaseCard.scrollTop = 0;

    if (state.fase === LAST_PHASE) {
      el.nextHint.textContent = `→ Turno ${state.turno + 1} · Minaccia ${state.minaccia + 1}`;
    } else {
      el.nextHint.textContent = `→ ${FASI[state.fase + 1].name}`;
    }

    const last = history[history.length - 1];
    el.undo.disabled = !last;
    el.undoLabel.textContent = last ? last.label : "Annulla";
    el.undo.setAttribute(
      "aria-label",
      last ? `Annulla: ${last.label}` : "Nessuna azione da annullare"
    );

    lastRendered = { turno: state.turno, minaccia: state.minaccia, fase: state.fase };
  }

  function renderPhaseBlocks() {
    const key = `${state.fase}:${notesVersion}`;
    if (key === renderedPhaseKey) return;
    renderedPhaseKey = key;
    renderBlocks(el.phaseSteps, String(state.fase));
  }

  function renderProcessList() {
    if (!activeProcess) return;
    const key = `${activeProcess}:${notesVersion}`;
    if (key === renderedProcessKey) return;
    renderedProcessKey = key;
    renderBlocks(el.processList, `proc:${activeProcess}`);
  }

  function renderBlocks(parent, container) {
    const blocks = blocksFor(container);
    parent.replaceChildren();

    blocks.forEach((block, index) => {
      if (block.kind === "window") {
        const windowEl = document.createElement("div");
        windowEl.className = "action-window";
        windowEl.textContent = "Finestra di azione";
        parent.appendChild(windowEl);
      } else {
        const row = document.createElement("div");
        row.className = "step-block";

        const num = document.createElement("span");
        num.className = "step-num";
        num.textContent = block.id;

        const body = document.createElement("div");
        body.className = "step-body";

        const text = document.createElement("p");
        text.className = "step-text";
        text.textContent = block.text;
        body.appendChild(text);

        if (block.process) body.appendChild(processButton(block.process));

        row.append(num, body);
        parent.appendChild(row);
      }

      // Uno spazio nota tra questo blocco e il successivo.
      if (index < blocks.length - 1) {
        parent.appendChild(gapElement(container, block.id));
      }
    });

    parent.appendChild(gapElement(container, "end"));
  }

  function processButton(kind) {
    const process = PROCESSI[kind];
    const button = document.createElement("button");
    button.type = "button";
    button.className = "process-btn";
    button.textContent = "Apri il processo →";
    button.setAttribute("aria-label", `Apri il processo ${process.name}`);
    button.addEventListener("click", () => openProcess(kind));
    return button;
  }

  function gapElement(container, anchor) {
    const gap = document.createElement("div");
    gap.className = "gap";

    const list = getNotes(container, anchor);
    if (list.length > 0) {
      const notesEl = document.createElement("div");
      notesEl.className = "gap-notes";
      list.forEach((note) => {
        const card = document.createElement("button");
        card.type = "button";
        card.className = "player-note";
        card.textContent = note.text;
        card.setAttribute("aria-label", `Modifica la nota: ${note.text}`);
        card.addEventListener("click", () => openNotesSheet(container, anchor));
        notesEl.appendChild(card);
      });
      gap.appendChild(notesEl);
    }

    const add = document.createElement("button");
    add.type = "button";
    add.className = "gap-add";
    add.innerHTML = '<span aria-hidden="true">＋</span>';
    add.title = "Aggiungi nota";
    add.setAttribute("aria-label", `Aggiungi una nota · ${gapLabel(container, anchor)}`);
    add.addEventListener("click", () => openNotesSheet(container, anchor));
    gap.appendChild(add);

    return gap;
  }

  /* ---------- counters ---------- */

  const counters = {
    turno: {
      min: 1,
      get: () => state.turno,
      set: (value) => {
        state.turno = value;
      },
    },
    minaccia: {
      min: 0,
      get: () => state.minaccia,
      set: (value) => {
        state.minaccia = value;
      },
    },
  };

  function bindCounterButton(button, kind, delta) {
    const counter = counters[kind];
    const name = kind === "turno" ? "Turno" : "Minaccia";
    let before = null;
    let timer = null;
    let interval = null;

    const applyStep = () => {
      const next = Math.max(counter.min, counter.get() + delta);
      if (next === counter.get()) return;
      if (kind === "minaccia") state.threatSetup = true;
      counter.set(next);
      render();
    };

    const commit = (snap) => {
      const amount = counter.get() - snap.state[kind];
      if (amount === 0) return;
      snap.label = `${name} ${amount > 0 ? "+" : ""}${amount}`;
      history.push(snap);
      trimHistory();
      save();
      render();
    };

    const stop = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
      document.removeEventListener("pointerup", stop);
      document.removeEventListener("pointercancel", stop);

      if (before) commit(before);
      before = null;
    };

    const singleStep = () => {
      const snap = snapshot(name);
      applyStep();
      commit(snap);
      vibrate(4);
    };

    button.addEventListener("pointerdown", (event) => {
      if (event.button !== undefined && event.button !== 0) return;
      event.preventDefault();
      stop();
      before = snapshot(name);
      applyStep();
      timer = setTimeout(() => {
        interval = setInterval(applyStep, 80);
      }, 380);
      document.addEventListener("pointerup", stop);
      document.addEventListener("pointercancel", stop);
    });

    button.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " " || event.key === "Spacebar") {
        event.preventDefault();
        singleStep();
      }
    });

    button.addEventListener("contextmenu", (event) => event.preventDefault());
    button.addEventListener("click", (event) => event.preventDefault());
  }

  /* ---------- phases ---------- */

  function buildStepper() {
    FASI.forEach((phase, index) => {
      const pill = document.createElement("button");
      pill.type = "button";
      pill.className = "step-pill";
      pill.textContent = String(index + 1);
      pill.setAttribute("aria-label", `Fase ${index + 1}: ${phase.name}`);
      pill.addEventListener("click", () => {
        if (state.fase === index) return;
        mutate(`Fase ${phase.name}`, () => {
          state.fase = index;
        });
        vibrate(8);
      });
      el.stepper.appendChild(pill);
    });
  }

  function advance() {
    if (state.fase === LAST_PHASE) {
      const next = { turno: state.turno + 1, minaccia: state.minaccia + 1, fase: 0 };
      mutate(`Turno ${next.turno}`, () => {
        state.turno = next.turno;
        state.minaccia = next.minaccia;
        state.fase = next.fase;
      });
      playSfx("round");
    } else {
      const target = state.fase + 1;
      mutate(`Fase ${FASI[target].name}`, () => {
        state.fase = target;
      });
    }
    vibrate(12);
  }

  /* ---------- notes ---------- */

  function currentNotes() {
    if (!noteScope) return [];
    return getNotes(noteScope.container, noteScope.anchor);
  }

  function touchNotes() {
    if (!noteScope) return;
    const key = noteKey(noteScope.container, noteScope.anchor);
    if (notes[key] && notes[key].length === 0) delete notes[key];
    notesVersion += 1;
    save();
    render();
    if (activeProcess) renderProcessList();
  }

  function noteButton(className, label, onClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = label;
    button.addEventListener("click", onClick);
    return button;
  }

  const NOTE_ICONS = {
    edit:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/></svg>',
    trash:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7l1 13h10l1-13"/><path d="M10 11v6M14 11v6"/></svg>',
  };

  function noteIconButton(kind, ariaLabel, onClick) {
    const button = noteButton("note-icon", "", onClick);
    button.innerHTML = NOTE_ICONS[kind];
    button.setAttribute("aria-label", ariaLabel);
    return button;
  }

  function renderNotesSheet() {
    const list = currentNotes();
    el.notesList.replaceChildren();
    el.notesEmpty.hidden = list.length > 0;

    list.forEach((note) => {
      const row = document.createElement("li");
      row.className = "note-row";

      if (editingNoteId === note.id) {
        row.classList.add("editing");
        const textarea = document.createElement("textarea");
        textarea.className = "note-edit";
        textarea.maxLength = NOTE_LIMIT;
        textarea.value = note.text;
        textarea.setAttribute("aria-label", "Modifica nota");

        const actions = document.createElement("div");
        actions.className = "note-actions";
        actions.append(
          noteButton("note-text-btn primary-mini", "Salva", () => {
            const value = textarea.value.trim().slice(0, NOTE_LIMIT);
            if (!value) {
              textarea.focus();
              return;
            }
            note.text = value;
            editingNoteId = null;
            touchNotes();
            renderNotesSheet();
            vibrate(6);
          }),
          noteButton("note-text-btn", "Annulla", () => {
            editingNoteId = null;
            renderNotesSheet();
          })
        );

        row.append(textarea, actions);
        requestAnimationFrame(() => {
          textarea.focus();
          textarea.setSelectionRange(textarea.value.length, textarea.value.length);
        });
      } else if (deletingNoteId === note.id) {
        row.classList.add("confirming");
        const text = document.createElement("p");
        text.className = "note-text";
        text.textContent = note.text;

        const actions = document.createElement("div");
        actions.className = "note-actions";
        actions.append(
          noteButton("note-text-btn danger", "Elimina", () => {
            if (!noteScope) return;
            const key = noteKey(noteScope.container, noteScope.anchor);
            notes[key] = (notes[key] || []).filter((item) => item.id !== note.id);
            deletingNoteId = null;
            touchNotes();
            renderNotesSheet();
            vibrate(8);
          }),
          noteButton("note-text-btn", "Annulla", () => {
            deletingNoteId = null;
            renderNotesSheet();
          })
        );

        row.append(text, actions);
      } else {
        const text = document.createElement("p");
        text.className = "note-text";
        text.textContent = note.text;

        const actions = document.createElement("div");
        actions.className = "note-actions";
        const edit = noteIconButton("edit", `Modifica nota: ${note.text}`, () => {
          editingNoteId = note.id;
          deletingNoteId = null;
          renderNotesSheet();
        });
        const remove = noteIconButton("trash", `Elimina nota: ${note.text}`, () => {
          deletingNoteId = note.id;
          editingNoteId = null;
          renderNotesSheet();
        });

        actions.append(edit, remove);
        row.append(text, actions);
      }

      el.notesList.appendChild(row);
    });
  }

  function updateNotesComposer() {
    const length = el.notesInput.value.length;
    el.notesCount.textContent = `${length}/${NOTE_LIMIT}`;
    el.notesAdd.disabled = el.notesInput.value.trim().length === 0;
  }

  function openNotesSheet(container, anchor) {
    noteScope = { container, anchor };
    editingNoteId = null;
    deletingNoteId = null;
    el.notesTitle.textContent = `Note · ${containerTitle(container)}`;
    el.notesSub.textContent = `${gapLabel(container, anchor)}. Restano anche con “Nuova partita”.`;
    el.notesInput.value = "";
    updateNotesComposer();
    renderNotesSheet();
    openOverlay(el.notesOverlay);
  }

  function closeNotesSheet() {
    editingNoteId = null;
    deletingNoteId = null;
    closeOverlay(el.notesOverlay);
  }

  function addNote() {
    if (!noteScope) return;
    const text = el.notesInput.value.trim().slice(0, NOTE_LIMIT);
    if (!text) {
      el.notesInput.focus();
      return;
    }

    const key = noteKey(noteScope.container, noteScope.anchor);
    if (!notes[key]) notes[key] = [];
    notes[key].push({ id: makeId(), text });

    el.notesInput.value = "";
    updateNotesComposer();
    touchNotes();
    renderNotesSheet();
    el.notesInput.focus();
    vibrate(6);
  }

  /* ---------- overlays ---------- */

  function openOverlay(overlay) {
    const active =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    overlayFocus.set(overlay, active);
    if (!overlayStack.includes(overlay)) overlayStack.push(overlay);
    overlay.hidden = false;
    document.body.classList.add("modal-open");
  }

  function closeOverlay(overlay) {
    overlay.hidden = true;
    const index = overlayStack.indexOf(overlay);
    if (index !== -1) overlayStack.splice(index, 1);
    if (overlayStack.length === 0) {
      document.body.classList.remove("modal-open");
    }
    const target = overlayFocus.get(overlay);
    overlayFocus.delete(overlay);
    if (target) target.focus();
  }

  function openProcess(kind) {
    if (!PROCESSI[kind]) return;
    activeProcess = kind;
    el.processTitle.textContent = PROCESSI[kind].name;
    renderProcessList();
    openOverlay(el.processOverlay);
  }

  function closeProcess() {
    activeProcess = null;
    renderedProcessKey = null;
    closeOverlay(el.processOverlay);
  }

  function openThreatDialog() {
    el.threatInput.value = String(state.minaccia);
    openOverlay(el.threatOverlay);
    requestAnimationFrame(() => {
      el.threatInput.focus();
      el.threatInput.select();
    });
  }

  function confirmThreat() {
    const raw = el.threatInput.value.trim();
    closeOverlay(el.threatOverlay);
    if (raw === "") return;

    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed)) return;

    const value = Math.min(999, Math.max(0, parsed));
    if (value === state.minaccia) {
      // Confermare lo stesso valore è comunque un'impostazione esplicita.
      if (!state.threatSetup) {
        state.threatSetup = true;
        save();
        render();
      }
      return;
    }

    mutate(`Minaccia ${value}`, () => {
      state.minaccia = value;
      state.threatSetup = true;
    });
    vibrate(8);
  }

  function confirmReset() {
    closeOverlay(el.resetOverlay);
    mutate("Nuova partita", () => {
      state = initialState();
    });
    vibrate(10);
  }

  /* ---------- rotation ---------- */

  function updateViewportVars() {
    // L'overlay deve coprire l'area realmente visibile: quando la tastiera
    // si apre, visualViewport si restringe mentre il layout resta fermo.
    const viewport = window.visualViewport;
    const height = viewport ? viewport.height : window.innerHeight;
    const top = viewport ? viewport.offsetTop : 0;
    document.documentElement.style.setProperty(
      "--vv-h",
      `${Math.max(0, Math.round(height))}px`
    );
    document.documentElement.style.setProperty(
      "--vv-top",
      `${Math.max(0, Math.round(top))}px`
    );
  }

  function layoutClasses() {
    const swapped = rotation === 90;
    const width = swapped ? window.innerHeight : window.innerWidth;
    const height = swapped ? window.innerWidth : window.innerHeight;
    document.documentElement.classList.toggle("narrow", width <= 350);
    document.documentElement.classList.toggle("compact-height", height <= 600);
    document.documentElement.classList.toggle("very-short", height < 480);
    updateRotateLabel();
    updateViewportVars();
  }

  function updateRotateLabel() {
    // L'etichetta descrive l'orientamento che si ottiene col prossimo tocco,
    // così resta corretta anche se il telefono è già in orizzontale.
    const rotated = rotation === 90;
    const targetLandscape = rotated
      ? window.innerWidth > window.innerHeight
      : window.innerHeight > window.innerWidth;
    const target = targetLandscape ? "orizzontale" : "verticale";
    const prefix = rotated ? "Riporta" : "Ruota";
    el.rotateBtn.setAttribute("aria-label", `${prefix} l'interfaccia in ${target}`);
    el.rotateBtn.title = `${prefix} in ${target}`;
  }

  function applyRotation(value, persist = true) {
    // Solo verticale (0) e orizzontale (90): niente 180°/270°.
    // Gli eventuali valori vecchi vengono riportati ai due stati utili.
    const quarterTurns = Math.round(value / 90);
    rotation = ((quarterTurns % 2) + 2) % 2 === 1 ? 90 : 0;
    el.rotator.dataset.rotation = String(rotation);
    el.rotator.scrollTop = 0;
    layoutClasses();

    if (persist) {
      save();
      vibrate(6);
    }
  }

  /* ---------- fullscreen ---------- */

  const FS_ICON_ENTER =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M8 3H5a2 2 0 0 0-2 2v3"/>' +
    '<path d="M21 8V5a2 2 0 0 0-2-2h-3"/>' +
    '<path d="M3 16v3a2 2 0 0 0 2 2h3"/>' +
    '<path d="M16 21h3a2 2 0 0 0 2-2v-3"/>' +
    "</svg>";

  const FS_ICON_EXIT =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M8 3v3a2 2 0 0 1-2 2H3"/>' +
    '<path d="M21 8h-3a2 2 0 0 1-2-2V3"/>' +
    '<path d="M3 16h3a2 2 0 0 1 2 2v3"/>' +
    '<path d="M16 21v-3a2 2 0 0 1 2-2h3"/>' +
    "</svg>";

  // Lo schermo intero va sulla radice: i browser applicano
  // "transform: none !important" all'elemento fullscreen non-root,
  // quindi usare #rotator annullerebbe la rotazione.
  const fullscreenTarget = document.documentElement;
  const fullscreenSupported =
    typeof fullscreenTarget.requestFullscreen === "function" ||
    typeof fullscreenTarget.webkitRequestFullscreen === "function";

  function fullscreenElement() {
    return document.fullscreenElement || document.webkitFullscreenElement || null;
  }

  function updateFullscreenButton() {
    if (!fullscreenSupported) return;
    const active = !!fullscreenElement();
    el.fullscreenBtn.innerHTML = active ? FS_ICON_EXIT : FS_ICON_ENTER;
    const label = active ? "Esci da schermo intero" : "Schermo intero";
    el.fullscreenBtn.setAttribute("aria-label", label);
    el.fullscreenBtn.setAttribute("aria-pressed", String(active));
    el.fullscreenBtn.title = label;
  }

  async function toggleFullscreen() {
    if (!fullscreenSupported) return;
    try {
      if (fullscreenElement()) {
        if (typeof document.exitFullscreen === "function") {
          await document.exitFullscreen();
        } else if (typeof document.webkitExitFullscreen === "function") {
          document.webkitExitFullscreen();
        }
      } else if (typeof fullscreenTarget.requestFullscreen === "function") {
        await fullscreenTarget.requestFullscreen();
      } else if (typeof fullscreenTarget.webkitRequestFullscreen === "function") {
        fullscreenTarget.webkitRequestFullscreen();
      }
    } catch (error) {
      /* fullscreen rifiutato o non disponibile: nessun cambio */
    }
    updateFullscreenButton();
  }

  /* ---------- wake lock ---------- */

  let wakeLock = null;
  let wakeRequest = null;

  function setWakeBadge(mode) {
    el.wakeBadge.dataset.state = mode;

    if (mode === "unsupported") {
      el.wakeText.textContent = "Non supportato";
      el.wakeBadge.title = "Questo browser non supporta il blocco dello schermo";
      el.wakeBadge.setAttribute("aria-label", "Blocco schermo non supportato da questo browser");
      el.wakeBadge.setAttribute("aria-disabled", "true");
      el.wakeBadge.removeAttribute("aria-pressed");
      return;
    }

    el.wakeBadge.removeAttribute("aria-disabled");
    const active = mode === "on";
    el.wakeText.textContent = active ? "Schermo attivo" : "Schermo spento";
    el.wakeBadge.setAttribute("aria-pressed", String(active));
    el.wakeBadge.setAttribute(
      "aria-label",
      active
        ? "Schermo sempre attivo: attivo. Tocca per disattivare"
        : "Schermo sempre attivo: spento. Tocca per attivare"
    );
    el.wakeBadge.title = active
      ? "Tocca per spegnere il blocco schermo"
      : "Tocca per tenere lo schermo acceso";
  }

  function releaseWakeLock() {
    if (!wakeLock) return;
    const lock = wakeLock;
    wakeLock = null;
    lock.release().catch(() => {
      /* già rilasciato */
    });
  }

  async function ensureWakeLock() {
    if (!("wakeLock" in navigator)) {
      setWakeBadge("unsupported");
      return;
    }
    if (!wakeWanted) return;
    if (wakeLock || wakeRequest || document.visibilityState !== "visible") return;

    wakeRequest = navigator.wakeLock
      .request("screen")
      .then((lock) => {
        if (!wakeWanted) {
          lock.release().catch(() => {});
          return;
        }
        wakeLock = lock;
        setWakeBadge("on");
        lock.addEventListener("release", () => {
          if (wakeLock === lock) wakeLock = null;
          if (document.visibilityState === "visible") setWakeBadge("off");
        });
      })
      .catch(() => {
        setWakeBadge("off");
      })
      .finally(() => {
        wakeRequest = null;
      });
  }

  function toggleWakeLock() {
    if (!("wakeLock" in navigator)) {
      setWakeBadge("unsupported");
      return;
    }

    if (wakeWanted) {
      wakeWanted = false;
      releaseWakeLock();
      setWakeBadge("off");
      save();
    } else {
      wakeWanted = true;
      save();
      ensureWakeLock();
    }
    vibrate(6);
  }

  /* ---------- init ---------- */

  load();
  applyRotation(rotation, false);
  buildStepper();
  render();

  el.appVersion.textContent = `v${APP_VERSION}`;

  if ("serviceWorker" in navigator) {
    const registerWorker = () => {
      navigator.serviceWorker.register("./sw.js").catch(() => {
        /* niente service worker: l'app resta usabile online */
      });
    };
    if (document.readyState === "complete") {
      registerWorker();
    } else {
      window.addEventListener("load", registerWorker, { once: true });
    }
  }

  bindCounterButton(el.turnoMinus, "turno", -1);
  bindCounterButton(el.turnoPlus, "turno", 1);
  bindCounterButton(el.minacciaMinus, "minaccia", -1);
  bindCounterButton(el.minacciaPlus, "minaccia", 1);

  el.next.addEventListener("click", advance);
  el.minacciaValue.addEventListener("click", openThreatDialog);

  el.rotateBtn.addEventListener("click", () => applyRotation(rotation === 0 ? 90 : 0));
  el.fullscreenBtn.addEventListener("click", toggleFullscreen);
  el.wakeBadge.addEventListener("click", toggleWakeLock);

  if (!fullscreenSupported) {
    el.fullscreenBtn.hidden = true;
  } else {
    updateFullscreenButton();
  }
  document.addEventListener("fullscreenchange", updateFullscreenButton);
  document.addEventListener("webkitfullscreenchange", updateFullscreenButton);

  document.addEventListener(
    "pointerdown",
    (event) => {
      const button =
        event.target instanceof Element ? event.target.closest("button") : null;
      if (button && !button.disabled) playSfx("tap");
    },
    { capture: true, passive: true }
  );

  document.addEventListener("keydown", (event) => {
    if (event.repeat) return;
    if (event.key !== "Enter" && event.key !== " " && event.key !== "Spacebar") return;
    const button =
      event.target instanceof Element ? event.target.closest("button") : null;
    if (button && !button.disabled) playSfx("tap");
  });

  el.notesClose.addEventListener("click", closeNotesSheet);
  el.processClose.addEventListener("click", closeProcess);
  el.notesForm.addEventListener("submit", (event) => {
    event.preventDefault();
    addNote();
  });
  el.notesInput.addEventListener("input", updateNotesComposer);

  el.undo.addEventListener("click", () => {
    const entry = history.pop();
    if (!entry) return;
    state = sanitize(entry.state);
    save();
    render();
    vibrate(8);
  });

  el.reset.addEventListener("click", () => openOverlay(el.resetOverlay));
  el.resetCancel.addEventListener("click", () => closeOverlay(el.resetOverlay));
  el.resetConfirm.addEventListener("click", confirmReset);

  el.threatCancel.addEventListener("click", () => closeOverlay(el.threatOverlay));
  el.threatConfirm.addEventListener("click", confirmThreat);
  el.threatInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      confirmThreat();
    }
  });
  el.threatInput.addEventListener("input", () => {
    el.threatInput.value = el.threatInput.value.replace(/\D+/g, "").slice(0, 3);
  });

  [el.threatOverlay, el.resetOverlay, el.notesOverlay, el.processOverlay].forEach(
    (overlay) => {
      overlay.addEventListener("click", (event) => {
        if (event.target !== overlay) return;
        if (overlay === el.notesOverlay) {
          closeNotesSheet();
        } else if (overlay === el.processOverlay) {
          closeProcess();
        } else {
          closeOverlay(overlay);
        }
      });
    }
  );

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;

    const top = overlayStack[overlayStack.length - 1];
    if (!top) return;

    if (top === el.notesOverlay) {
      if (editingNoteId || deletingNoteId) {
        editingNoteId = null;
        deletingNoteId = null;
        renderNotesSheet();
        return;
      }
      closeNotesSheet();
      return;
    }

    if (top === el.processOverlay) {
      closeProcess();
      return;
    }

    closeOverlay(top);
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") ensureWakeLock();
  });

  window.addEventListener("pointerdown", ensureWakeLock, { passive: true });
  window.addEventListener("focus", ensureWakeLock);
  window.addEventListener("resize", layoutClasses);
  window.addEventListener("orientationchange", layoutClasses);
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", layoutClasses);
    window.visualViewport.addEventListener("scroll", layoutClasses);
  }

  if (!("wakeLock" in navigator)) {
    setWakeBadge("unsupported");
  } else if (!wakeWanted) {
    setWakeBadge("off");
  } else if (document.visibilityState === "visible") {
    ensureWakeLock();
  }
})();
