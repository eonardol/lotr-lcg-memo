(() => {
  "use strict";

  const APP_VERSION =
    typeof self.APP_VERSION === "string" && self.APP_VERSION ? self.APP_VERSION : "dev";

  const step = (id, options) => ({ id, kind: "step", ...options });
  const actionWindow = (id) => ({ id, kind: "window" });

  // Passi esatti del regolamento. `id` è anche l'ancora delle note e dei
  // segnalibri: una nota agganciata a "1.3" compare tra 1.3 e il blocco
  // successivo. I testi stanno in i18n.js, indicizzati per id.
  // "end" è la posizione finale della fase/processo.
  const FASI = [
    {
      blocks: [
        step("1.1"),
        step("1.2"),
        step("1.3"),
        actionWindow("w-1"),
        step("1.4"),
      ],
    },
    {
      blocks: [
        step("2.1"),
        step("2.2"),
        step("2.3"),
        step("2.4"),
      ],
    },
    {
      blocks: [
        step("3.1"),
        actionWindow("w-1"),
        step("3.2"),
        actionWindow("w-2"),
        step("3.3"),
        actionWindow("w-3"),
        step("3.4", { quest: true }),
        actionWindow("w-4"),
        step("3.5"),
      ],
    },
    {
      blocks: [
        step("4.1"),
        step("4.2"),
        actionWindow("w-1"),
        step("4.3"),
      ],
    },
    {
      blocks: [
        step("5.1"),
        step("5.2"),
        actionWindow("w-1"),
        step("5.3"),
        actionWindow("w-2"),
        step("5.4"),
      ],
    },
    {
      blocks: [
        step("6.1"),
        step("6.2"),
        actionWindow("w-1"),
        step("6.3"),
        step("6.4a", { process: "nemici" }),
        step("6.5"),
        step("6.6"),
        step("6.7"),
        step("6.8a", { process: "giocatori" }),
        step("6.9"),
        step("6.10"),
        step("6.11"),
      ],
    },
    {
      blocks: [
        step("7.1"),
        step("7.2"),
        step("7.3"),
        step("7.4"),
        actionWindow("w-1"),
        step("7.5"),
      ],
    },
  ];

  // Processi di combattimento mostrati nei popup, a partire dai passi 6.3 e 6.7.
  const PROCESSI = {
    nemici: {
      blocks: [
        step("6.4b"),
        actionWindow("w-1"),
        step("6.4.1"),
        actionWindow("w-2"),
        step("6.4.2"),
        actionWindow("w-3"),
        step("6.4.3"),
        actionWindow("w-4"),
        step("6.4.4"),
      ],
    },
    giocatori: {
      blocks: [
        step("6.8b"),
        step("6.8.1"),
        actionWindow("w-1"),
        step("6.8.2"),
        actionWindow("w-2"),
        step("6.8.3"),
        actionWindow("w-3"),
        step("6.8.4"),
      ],
    },
  };

  /* ---------- i18n ---------- */

  const I18N = self.I18N || {};
  const LANG_NAMES = self.I18N_LANG_NAMES || {};
  const LANGS = Object.keys(I18N);
  const DEFAULT_LANG = LANGS.includes("it") ? "it" : LANGS[0] || "it";
  let lang = "";

  function dict() {
    return I18N[lang] || I18N[DEFAULT_LANG] || {};
  }

  function t(key, vars) {
    const value = key
      .split(".")
      .reduce((node, part) => (node ? node[part] : undefined), dict());
    if (typeof value !== "string") return key;
    if (!vars) return value;
    return value.replace(/\{(\w+)\}/g, (match, name) =>
      vars[name] === undefined ? match : String(vars[name])
    );
  }

  function phaseName(index) {
    const names = dict().phases;
    return Array.isArray(names) && typeof names[index] === "string"
      ? names[index]
      : `Fase ${index + 1}`;
  }

  function processName(kind) {
    const names = dict().processes;
    return names && typeof names[kind] === "string" ? names[kind] : kind;
  }

  function stepText(block) {
    const steps = dict().steps;
    return steps && typeof steps[block.id] === "string" ? steps[block.id] : block.id;
  }

  // Le etichette della cronologia sono descrittori { key, vars } per poterle
  // ritradurre quando si cambia lingua; le stringhe restano supportate per i
  // salvataggi precedenti.
  function actionLabel(key, vars) {
    return { key, vars: vars || null };
  }

  function labelText(value) {
    if (typeof value === "string") return value;
    if (value && typeof value.key === "string") {
      return t(value.key, value.vars || undefined);
    }
    return "";
  }

  function detectLanguage() {
    try {
      const param = new URLSearchParams(window.location.search).get("lang");
      if (param && I18N[param]) return param;
    } catch (error) {
      /* URL non leggibile: si prosegue con le altre fonti */
    }
    if (I18N[lang]) return lang;
    const candidates = (
      navigator.languages && navigator.languages.length
        ? navigator.languages
        : [navigator.language || ""]
    ).map((code) => String(code).slice(0, 2).toLowerCase());
    return candidates.find((code) => I18N[code]) || DEFAULT_LANG;
  }

  function applyStaticTexts() {
    document.querySelectorAll("[data-i18n]").forEach((node) => {
      node.textContent = t(node.dataset.i18n);
    });
    document.querySelectorAll("[data-i18n-aria]").forEach((node) => {
      node.setAttribute("aria-label", t(node.dataset.i18nAria));
    });
    document.querySelectorAll("[data-i18n-title]").forEach((node) => {
      node.title = t(node.dataset.i18nTitle);
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
      node.placeholder = t(node.dataset.i18nPlaceholder);
    });
    document.title = t("ui.appTitle");
    const description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute("content", t("ui.appDescription"));
    document.documentElement.lang = lang;
  }

  function updateLanguageButton() {
    if (!el.langBtn) return;
    const next = LANGS[(LANGS.indexOf(lang) + 1) % LANGS.length] || DEFAULT_LANG;
    const names = LANG_NAMES[lang] || {};
    const currentName = names[lang] || lang;
    const nextName = names[next] || next;
    el.langBtn.textContent = String(lang).toUpperCase();
    el.langBtn.setAttribute(
      "aria-label",
      t("ui.languageAria", { current: currentName, next: nextName })
    );
    el.langBtn.title = t("ui.languageTitle", { next: nextName });
  }

  function refreshOpenDialogs() {
    if (noteScope && !el.notesOverlay.hidden) {
      el.notesTitle.textContent = t("ui.notesTitle", {
        container: containerTitle(noteScope.container),
      });
      el.notesSub.textContent = t("ui.notesSub", {
        gap: gapLabel(noteScope.container, noteScope.anchor),
      });
      renderNotesSheet();
    }
    if (activeProcess) {
      el.processTitle.textContent = processName(activeProcess);
      renderProcessList();
    }
    if (!el.questOverlay.hidden) {
      syncQuestInputs();
      updateQuestResult();
    }
    if (threatTargetId) {
      const index = playerIndex(threatTargetId);
      if (index !== -1) {
        el.threatSub.textContent = t("ui.threatSubNamed", {
          name: playerName(state.players[index], index),
        });
      }
    }
    if (nameTargetId) {
      const index = playerIndex(nameTargetId);
      if (index !== -1) {
        const name = playerName(state.players[index], index);
        el.nameTitle.textContent = t("ui.nameDialogTitle", { name });
        el.nameInput.setAttribute("aria-label", t("ui.nameInputAria", { name }));
      }
    }
  }

  function setLanguage(next) {
    if (!I18N[next] || next === lang) return;
    lang = next;
    renderedPhaseKey = null;
    renderedProcessKey = null;
    renderedPlayersKey = null;
    applyStaticTexts();
    updateLanguageButton();
    updateRotateLabel();
    setWakeBadge(wakeMode);
    render();
    if (activeProcess) renderProcessList();
    refreshOpenDialogs();
    save();
  }

  function cycleLanguage() {
    if (LANGS.length < 2) return;
    const index = LANGS.indexOf(lang);
    setLanguage(LANGS[(index + 1) % LANGS.length]);
    vibrate(6);
  }

  const STORAGE_KEY = "rings-turn-log/v1";
  // Chiave del vecchio nome dell'app: i salvataggi esistenti vengono letti
  // una volta e riscritti sotto la nuova chiave.
  const LEGACY_STORAGE_KEY = "lotr-lcg-memo/v1";
  const HISTORY_LIMIT = 30;
  const NOTE_LIMIT = 240;
  const NOTES_PER_GAP = 30;
  const THREAT_ALERT = 50;
  const LAST_PHASE = FASI.length - 1;
  // Fase di Combattimento: i suoi processi condividono i pallini di note e
  // segnalibro della fase 6.
  const PROCESSI_FASE = { 5: ["nemici", "giocatori"] };

  const $ = (id) => document.getElementById(id);

  const el = {
    rotator: $("rotator"),
    rotateBtn: $("rotateBtn"),
    langBtn: $("langBtn"),
    fullscreenBtn: $("fullscreenBtn"),
    wakeBadge: $("wakeBadge"),
    wakeText: $("wakeText"),
    appVersion: $("appVersion"),
    turnoValue: $("turnoValue"),
    players: $("players"),
    turnoMinus: $("turnoMinus"),
    turnoPlus: $("turnoPlus"),
    stepper: $("stepper"),
    phaseEyebrow: $("phaseEyebrow"),
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
    questOverlay: $("questOverlay"),
    questClose: $("questClose"),
    questWillpowerInput: $("questWillpowerInput"),
    questWillpowerMinus: $("questWillpowerMinus"),
    questWillpowerPlus: $("questWillpowerPlus"),
    questThreatInput: $("questThreatInput"),
    questThreatMinus: $("questThreatMinus"),
    questThreatPlus: $("questThreatPlus"),
    questProgress: $("questProgress"),
    questProgressValue: $("questProgressValue"),
    questRaise: $("questRaise"),
    questRaiseLabel: $("questRaiseLabel"),
    questDone: $("questDone"),
    questLock: $("questLock"),
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
    threatSub: $("threatSub"),
    threatConfirm: $("threatConfirm"),
    threatCancel: $("threatCancel"),
    nameOverlay: $("nameOverlay"),
    nameInput: $("nameInput"),
    nameTitle: $("nameTitle"),
    nameConfirm: $("nameConfirm"),
    nameCancel: $("nameCancel"),
    resetOverlay: $("resetOverlay"),
    resetConfirm: $("resetConfirm"),
    resetCancel: $("resetCancel"),
  };

  const PLAYER_LIMIT = 4;
  const PLAYER_NAME_MAX = 18;
  const THREAT_DEFAULT = 30;
  const THREAT_MAX = 999;
  const WILLPOWER_MIN = -999;
  const WILLPOWER_MAX = 999;

  const makePlayer = (name = "", setup = false) => ({
    id: makeId(),
    name,
    threat: THREAT_DEFAULT,
    setup,
  });

  const makeQuest = () => ({ willpower: 0, threat: 0, applied: false });

  const initialState = () => ({
    turno: 1,
    fase: 0,
    players: [makePlayer()],
    bookmark: null,
    quest: makeQuest(),
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
    undo: makeSound("./undo.mp3", 0.7),
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

  function sanitizePlayer(raw) {
    const source = raw && typeof raw === "object" ? raw : {};
    const name =
      typeof source.name === "string" ? source.name.trim().slice(0, PLAYER_NAME_MAX) : "";
    const threat = Math.floor(Number(source.threat));
    return {
      id: typeof source.id === "string" && source.id ? source.id : makeId(),
      name,
      threat: Number.isFinite(threat)
        ? Math.min(THREAT_MAX, Math.max(0, threat))
        : THREAT_DEFAULT,
      // Senza flag esplicito il promemoria non va mostrato (salvataggi vecchi).
      setup: typeof source.setup === "boolean" ? source.setup : true,
    };
  }

  function validStep(container, stepId) {
    return blocksFor(container).some(
      (block) => block.kind === "step" && block.id === stepId
    );
  }

  function sanitizeBookmark(raw) {
    if (!raw || typeof raw !== "object") return null;
    const container = typeof raw.container === "string" ? raw.container : "";
    const stepId = typeof raw.step === "string" ? raw.step : "";
    if (!isKnownContainer(container) || !validStep(container, stepId)) return null;
    return { container, step: stepId };
  }

  function sanitizeQuest(raw) {
    const source = raw && typeof raw === "object" ? raw : {};
    const willpower = Math.floor(Number(source.willpower));
    const threat = Math.floor(Number(source.threat));
    const value = Number.isFinite(willpower)
      ? Math.min(WILLPOWER_MAX, Math.max(WILLPOWER_MIN, willpower))
      : 0;
    const staging = Number.isFinite(threat)
      ? Math.min(THREAT_MAX, Math.max(0, threat))
      : 0;
    return {
      willpower: value,
      threat: staging,
      // Lo stato "applicato" ha senso solo se la Minaccia supera la Volontà.
      applied: Boolean(source.applied) && value < staging,
    };
  }

  function sanitizeActionLabel(raw) {
    if (typeof raw === "string") return raw;
    if (raw && typeof raw.key === "string") {
      const vars = {};
      if (raw.vars && typeof raw.vars === "object") {
        Object.entries(raw.vars).forEach(([key, value]) => {
          if (typeof value === "string" || typeof value === "number") {
            vars[key] = value;
          }
        });
      }
      return { key: raw.key, vars };
    }
    return "";
  }

  function sanitize(raw) {
    const turno = Math.floor(Number(raw && raw.turno));
    const fase = Math.floor(Number(raw && raw.fase));

    let players = [];
    if (raw && Array.isArray(raw.players) && raw.players.length > 0) {
      players = raw.players.slice(0, PLAYER_LIMIT).map((player) => sanitizePlayer(player));
    } else {
      // Migrazione dalla 1.0.0: un solo giocatore con la vecchia Minaccia.
      const minaccia = Math.floor(Number(raw && raw.minaccia));
      const threatSetup =
        raw && typeof raw.threatSetup === "boolean" ? raw.threatSetup : true;
      players = [
        sanitizePlayer({
          threat: Number.isFinite(minaccia) ? minaccia : THREAT_DEFAULT,
          setup: threatSetup,
        }),
      ];
    }

    return {
      turno: Number.isFinite(turno) ? Math.max(1, turno) : 1,
      fase: Number.isFinite(fase) ? Math.min(LAST_PHASE, Math.max(0, fase)) : 0,
      players,
      bookmark: sanitizeBookmark(raw && raw.bookmark),
      quest: sanitizeQuest(raw && raw.quest),
    };
  }

  function cloneState(source) {
    return {
      turno: source.turno,
      fase: source.fase,
      players: source.players.map((player) => ({ ...player })),
      bookmark: source.bookmark ? { ...source.bookmark } : null,
      quest: source.quest ? { ...source.quest } : makeQuest(),
    };
  }

  function playerName(player, index) {
    const name = player && typeof player.name === "string" ? player.name.trim() : "";
    return name || t("ui.playerDefault", { n: index + 1 });
  }

  function playerById(id) {
    return state.players.find((player) => player.id === id) || null;
  }

  function playerIndex(id) {
    return state.players.findIndex((player) => player.id === id);
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
      const kind = container.slice(5);
      return PROCESSI[kind] ? processName(kind) : t("ui.containerProcess");
    }
    return FASI[Number(container)] ? phaseName(Number(container)) : t("ui.containerPhase");
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
    const finale = t(
      isProcessContainer(container) ? "ui.gapEndProcess" : "ui.gapEndPhase"
    );
    if (anchor === "end") return finale;

    const index = blocks.findIndex((block) => block.id === anchor);
    if (index === -1) return finale;

    const next = blocks[index + 1];
    if (!next) return finale;

    const name = (block) =>
      block.kind === "window" ? t("ui.gapWindow") : block.id;
    return t("ui.gapBetween", { a: name(blocks[index]), b: name(next) });
  }

  function phaseHasNotes(index) {
    const prefixes = [`${index}::`];
    (PROCESSI_FASE[index] || []).forEach((kind) => prefixes.push(`proc:${kind}::`));
    return Object.keys(notes).some((key) =>
      prefixes.some((prefix) => key.startsWith(prefix))
    );
  }

  // Fase a cui appartiene un contenitore: i processi di combattimento
  // condividono la fase 6 (indice 5).
  function phaseOfContainer(container) {
    if (!container) return -1;
    if (isProcessContainer(container)) {
      const kind = container.slice(5);
      const found = Object.keys(PROCESSI_FASE).find((index) =>
        PROCESSI_FASE[index].includes(kind)
      );
      return found === undefined ? -1 : Number(found);
    }
    return /^\d+$/.test(container) ? Number(container) : -1;
  }

  function phaseHasBookmark(index) {
    if (!state.bookmark) return false;
    return phaseOfContainer(state.bookmark.container) === index;
  }

  function isBookmarked(container, stepId) {
    return (
      !!state.bookmark &&
      state.bookmark.container === container &&
      state.bookmark.step === stepId
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
      // Prima la chiave nuova, poi quella del vecchio nome dell'app.
      let raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) raw = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (!data || typeof data !== "object") return;
      if (data.state) state = sanitize(data.state);
      if (Array.isArray(data.history)) {
        history = data.history
          .filter((entry) => entry && entry.state && entry.label)
          .slice(-HISTORY_LIMIT)
          .map((entry) => ({
            state: sanitize(entry.state),
            label: sanitizeActionLabel(entry.label),
          }));
      }
      notes = sanitizeNotes(data.notes);
      if (typeof data.wake === "boolean") wakeWanted = data.wake;
      if (typeof data.lang === "string" && I18N[data.lang]) lang = data.lang;
      // Solo due stati: verticale (0) e orizzontale (90).
      // I vecchi salvataggi a 270 vengono riportati a 90, 180 a 0.
      if ([90, 270].includes(Number(data.rotation))) {
        rotation = 90;
      }
      // Migrazione: riscrive subito i dati sotto la chiave nuova.
      if (!localStorage.getItem(STORAGE_KEY)) save();
    } catch (error) {
      /* storage non disponibile: si continua senza persistenza */
    }
  }

  function save() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ state, history, notes, wake: wakeWanted, rotation, lang })
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
    // Copia profonda: i giocatori sono oggetti, una copia superficiale
    // farebbe condividere lo stesso oggetto tra stato e cronologia.
    return { state: cloneState(state), label };
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

    el.turnoValue.textContent = String(state.turno);
    el.turnoValue.classList.toggle("long", String(state.turno).length > 2);
    el.turnoMinus.disabled = state.turno <= 1;

    renderPlayers();

    if (turnoChanged && lastRendered) pop(el.turnoValue);

    Array.from(el.stepper.children).forEach((pill, index) => {
      const current = index === state.fase;
      const hasNotes = phaseHasNotes(index);
      const hasBookmark = phaseHasBookmark(index);
      pill.classList.toggle("current", current);
      pill.classList.toggle("done", index < state.fase);
      pill.classList.toggle("has-notes", hasNotes);
      pill.classList.toggle("has-bookmark", hasBookmark);
      const name = pill.querySelector(".step-pill-name");
      if (name) name.textContent = phaseName(index);
      const extra = [
        hasNotes ? t("ui.hasNotes") : "",
        hasBookmark ? t("ui.hasBookmark") : "",
      ]
        .filter(Boolean)
        .join(", ");
      pill.setAttribute(
        "aria-label",
        t("ui.phaseAria", { n: index + 1, name: phaseName(index) }) +
          (extra ? ` (${extra})` : "")
      );
      if (current) {
        pill.setAttribute("aria-current", "step");
      } else {
        pill.removeAttribute("aria-current");
      }
    });

    el.phaseEyebrow.textContent = t("ui.phaseOf", {
      n: state.fase + 1,
      total: FASI.length,
    });
    el.phaseName.textContent = phaseName(state.fase);
    renderPhaseBlocks();
    if (faseChanged) el.phaseCard.scrollTop = 0;

    if (state.fase === LAST_PHASE) {
      el.nextHint.textContent = t("ui.nextTurnHint", { n: state.turno + 1 });
    } else {
      el.nextHint.textContent = t("ui.nextPhaseHint", {
        name: phaseName(state.fase + 1),
      });
    }

    const last = history[history.length - 1];
    el.undo.disabled = !last;
    el.undoLabel.textContent = last ? labelText(last.label) : t("ui.undo");
    el.undo.setAttribute(
      "aria-label",
      last
        ? t("ui.undoAria", { label: labelText(last.label) })
        : t("ui.undoNone")
    );

    lastRendered = { turno: state.turno, fase: state.fase };
  }

  /* ---------- players ---------- */

  const playerEls = new Map();
  const playerLastThreat = new Map();
  let renderedPlayersKey = null;
  let tabletMode = false;

  function isTablet() {
    return tabletMode;
  }

  function renderPlayers() {
    const tablet = isTablet();
    const visible = tablet ? state.players : state.players.slice(0, 1);
    const key = [
      lang,
      tablet ? "tablet" : "phone",
      visible.map((player) => `${player.id}:${player.name}`).join("|"),
      tablet && state.players.length < PLAYER_LIMIT ? "add" : "",
    ].join("::");

    if (key !== renderedPlayersKey) {
      renderedPlayersKey = key;
      playerEls.clear();
      playerLastThreat.clear();
      el.players.replaceChildren();

      visible.forEach((player) => {
        el.players.appendChild(buildPlayerCard(player));
        playerLastThreat.set(player.id, player.threat);
      });

      if (tablet && state.players.length < PLAYER_LIMIT) {
        el.players.appendChild(buildAddPlayerTile());
      }
    }

    updatePlayerCards(visible);
  }

  function buildPlayerCard(player) {
    const card = document.createElement("article");
    card.className = "counter counter-player";
    card.dataset.id = player.id;

    // Didascalia solo su tablet: chiarisce che il numero è la Minaccia.
    const caption = document.createElement("span");
    caption.className = "player-caption";
    caption.textContent = t("ui.threat");
    card.appendChild(caption);

    const head = document.createElement("div");
    head.className = "player-head";

    const name = document.createElement("button");
    name.type = "button";
    name.className = "player-name";
    name.addEventListener("click", () => openNameDialog(player.id));

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "player-remove";
    remove.innerHTML =
      '<span class="icon-mask icon-close" aria-hidden="true"></span>';
    remove.addEventListener("click", () => removePlayer(player.id));

    head.append(name, remove);
    card.appendChild(head);

    const row = document.createElement("div");
    row.className = "counter-row";

    const minus = document.createElement("button");
    minus.type = "button";
    minus.className = "step";
    minus.textContent = "−";

    const value = document.createElement("button");
    value.type = "button";
    value.className = "counter-value value-btn";
    value.setAttribute("aria-live", "polite");
    value.addEventListener("click", () => openThreatDialog(player.id));

    const plus = document.createElement("button");
    plus.type = "button";
    plus.className = "step";
    plus.textContent = "+";

    row.append(minus, value, plus);
    card.appendChild(row);

    const hint = document.createElement("span");
    hint.className = "edit-hint";
    card.appendChild(hint);

    bindCounterButton(minus, playerCounter(player.id), -1);
    bindCounterButton(plus, playerCounter(player.id), 1);

    playerEls.set(player.id, { card, head, name, remove, minus, value, plus, hint });
    return card;
  }

  function buildAddPlayerTile() {
    const add = document.createElement("button");
    add.type = "button";
    add.className = "counter counter-add";
    add.setAttribute("aria-label", t("ui.addPlayerAria"));
    add.innerHTML =
      '<span class="add-mark icon-mask icon-plus" aria-hidden="true"></span>' +
      `<span class="add-label">${t("ui.addPlayer")}</span>`;
    add.addEventListener("click", addPlayer);
    return add;
  }

  function updatePlayerCards(visible) {
    const tablet = isTablet();
    const canRemove = tablet && state.players.length > 1;

    visible.forEach((player, index) => {
      const refs = playerEls.get(player.id);
      if (!refs) return;

      const label = playerName(player, index);
      const needsSetup = !player.setup;
      const alert = player.threat >= THREAT_ALERT;
      const previousThreat = playerLastThreat.get(player.id);

      if (previousThreat !== undefined && previousThreat !== player.threat) {
        pop(refs.value);
      }
      playerLastThreat.set(player.id, player.threat);

      refs.name.textContent = tablet
        ? label
        : player.name.trim()
          ? t("ui.threatNamed", { name: label })
          : t("ui.threat");
      refs.name.disabled = !tablet;
      refs.name.setAttribute(
        "aria-label",
        tablet
          ? t("ui.renamePlayerAria", { name: label })
          : t("ui.threatOfAria", { name: label })
      );

      refs.remove.hidden = !canRemove;
      refs.remove.setAttribute("aria-label", t("ui.removePlayerAria", { name: label }));

      refs.value.textContent = String(player.threat);
      refs.value.classList.toggle("long", String(player.threat).length > 2);
      refs.value.classList.toggle("alert", alert);
      refs.value.setAttribute(
        "aria-label",
        t("ui.threatValueAria", {
          name: label,
          value: player.threat,
          alert: alert ? t("ui.alertSuffix") : "",
          setup: needsSetup ? t("ui.setupSuffix") : "",
        })
      );

      refs.minus.disabled = player.threat <= 0;
      refs.minus.setAttribute(
        "aria-label",
        t("ui.minusThreatAria", { name: label })
      );
      refs.plus.setAttribute(
        "aria-label",
        t("ui.plusThreatAria", { name: label })
      );

      refs.card.classList.toggle("needs-setup", needsSetup);
      if (!needsSetup) refs.card.classList.remove("threat-pulse");
      refs.hint.textContent = needsSetup ? t("ui.setupHint") : t("ui.editHint");
    });
  }

  function pulseThreatReminders(onlyId) {
    const cards = Array.from(
      el.players.querySelectorAll(".counter-player.needs-setup")
    ).filter((card) => !onlyId || card.dataset.id === onlyId);
    if (cards.length === 0) return;

    // Togli, forza un reflow e rimetti: l'animazione riparte anche se la
    // card era già in promemoria (es. minaccia rimasta a 30).
    cards.forEach((card) => card.classList.remove("threat-pulse"));
    void el.players.offsetWidth;
    cards.forEach((card) => card.classList.add("threat-pulse"));
  }

  function addPlayer() {
    if (state.players.length >= PLAYER_LIMIT) return;
    const player = makePlayer();
    mutate(actionLabel("history.addPlayer"), () => {
      state.players.push(player);
    });
    pulseThreatReminders(player.id);
    vibrate(8);
  }

  function removePlayer(id) {
    if (state.players.length <= 1) return;
    const index = playerIndex(id);
    if (index === -1) return;
    const label = playerName(state.players[index], index);
    mutate(actionLabel("history.removePlayer", { name: label }), () => {
      state.players = state.players.filter((player) => player.id !== id);
    });
    vibrate(8);
  }

  function acceptThreatSetup() {
    // Andare avanti o cambiare fase vale come "ok, il valore attuale va bene"
    // (30 è il default). Spegne il promemoria senza cambiare la minaccia.
    state.players.forEach((player) => {
      if (!player.setup) player.setup = true;
    });
  }

  function toggleBookmark(container, stepId) {
    // Un solo segnalibro: toccare lo stesso passo lo rimuove, toccarne un
    // altro lo sposta. Non passa dalla cronologia (come le note).
    const same = isBookmarked(container, stepId);
    state.bookmark = same ? null : { container, step: stepId };
    renderedPhaseKey = null;
    renderedProcessKey = null;
    save();
    render();
    if (activeProcess) renderProcessList();
    vibrate(6);
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
        windowEl.textContent = t("ui.actionWindow");
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
        text.textContent = stepText(block);
        body.appendChild(text);

        if (block.process) body.appendChild(processButton(block.process));
        if (block.quest) body.appendChild(questButton());

        const bookmarked = isBookmarked(container, block.id);
        row.classList.toggle("bookmarked", bookmarked);

        const bookmark = document.createElement("button");
        bookmark.type = "button";
        bookmark.className = "step-bookmark";
        bookmark.innerHTML = ICON_BOOKMARK;
        bookmark.setAttribute("aria-pressed", String(bookmarked));
        bookmark.setAttribute(
          "aria-label",
          bookmarked
            ? t("ui.bookmarkRemove", { step: block.id })
            : t("ui.bookmarkAdd", { step: block.id })
        );
        bookmark.title = bookmarked
          ? t("ui.bookmarkRemoveShort")
          : t("ui.bookmarkAddShort");
        bookmark.addEventListener("click", () => toggleBookmark(container, block.id));

        // Tutta la riga è un bersaglio per il segnalibro: il nastro resta
        // l'indicatore e il controllo da tastiera. I pulsanti interni (nastro,
        // “Apri il processo”) gestiscono già il proprio click.
        row.addEventListener("click", (event) => {
          const target = event.target instanceof Element ? event.target : null;
          if (target && target.closest("button")) return;
          const selection = window.getSelection();
          if (selection && !selection.isCollapsed) return;
          toggleBookmark(container, block.id);
        });

        row.append(num, body, bookmark);
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
    const button = document.createElement("button");
    button.type = "button";
    button.className = "process-btn";
    button.textContent = t("ui.openProcess");
    button.setAttribute(
      "aria-label",
      t("ui.openProcessAria", { name: processName(kind) })
    );
    button.addEventListener("click", () => openProcess(kind));
    return button;
  }

  function questButton() {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "process-btn quest-btn";
    button.innerHTML =
      '<img class="quest-btn-icon" src="./progress.png" alt="" aria-hidden="true">' +
      `<span>${t("ui.questOpen")}</span>`;
    button.setAttribute("aria-label", t("ui.questOpenAria"));
    button.addEventListener("click", openQuest);
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
        card.setAttribute(
          "aria-label",
          t("ui.editNoteAria", { text: note.text })
        );
        card.addEventListener("click", () => openNotesSheet(container, anchor));
        notesEl.appendChild(card);
      });
      gap.appendChild(notesEl);
    }

    const add = document.createElement("button");
    add.type = "button";
    add.className = "gap-add";
    add.innerHTML = '<span class="icon-mask icon-plus" aria-hidden="true"></span>';
    add.title = t("ui.addNoteTitle");
    add.setAttribute(
      "aria-label",
      t("ui.addNoteAria", { gap: gapLabel(container, anchor) })
    );
    add.addEventListener("click", () => openNotesSheet(container, anchor));
    gap.appendChild(add);

    return gap;
  }

  /* ---------- counters ---------- */

  const turnoCounter = {
    min: 1,
    label: () => t("ui.turn"),
    get: () => state.turno,
    set: (value) => {
      state.turno = value;
    },
  };

  function playerCounter(id) {
    return {
      min: 0,
      label: () => {
        const index = playerIndex(id);
        return index === -1
          ? t("ui.threat")
          : t("ui.threatNamed", { name: playerName(state.players[index], index) });
      },
      get: () => {
        const player = playerById(id);
        return player ? player.threat : 0;
      },
      set: (value) => {
        const player = playerById(id);
        if (!player) return;
        player.threat = value;
        // Un cambio esplicito spegne il promemoria di quel giocatore.
        player.setup = true;
      },
    };
  }

  function bindCounterButton(button, counter, delta) {
    let before = null;
    let timer = null;
    let interval = null;

    const startSession = () => ({
      snap: snapshot(counter.label()),
      value: counter.get(),
    });

    const applyStep = () => {
      const current = counter.get();
      const next = Math.min(THREAT_MAX, Math.max(counter.min, current + delta));
      if (next === current) return;
      counter.set(next);
      render();
    };

    const commit = (session) => {
      const amount = counter.get() - session.value;
      if (amount === 0) return;
      session.snap.label = actionLabel("history.counter", {
        label: labelText(counter.label()),
        amount: `${amount > 0 ? "+" : ""}${amount}`,
      });
      history.push(session.snap);
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
      const session = startSession();
      applyStep();
      commit(session);
      vibrate(4);
    };

    button.addEventListener("pointerdown", (event) => {
      if (event.button !== undefined && event.button !== 0) return;
      event.preventDefault();
      stop();
      before = startSession();
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

      const num = document.createElement("span");
      num.className = "step-pill-num";
      num.textContent = String(index + 1);

      // Su tablet il nome affianca il numero (vedi styles.css).
      const name = document.createElement("span");
      name.className = "step-pill-name";
      name.textContent = phaseName(index);

      pill.append(num, name);
      pill.setAttribute(
        "aria-label",
        t("ui.phaseAria", { n: index + 1, name: phaseName(index) })
      );
      pill.addEventListener("click", () => {
        if (state.fase === index) return;
        mutate(actionLabel("history.phase", { name: phaseName(index) }), () => {
          acceptThreatSetup();
          state.fase = index;
        });
        vibrate(8);
      });
      el.stepper.appendChild(pill);
    });
  }

  function advance() {
    if (state.fase === LAST_PHASE) {
      const nextTurno = state.turno + 1;
      mutate(actionLabel("history.turn", { n: nextTurno }), () => {
        acceptThreatSetup();
        state.turno = nextTurno;
        state.fase = 0;
        // Nuovo round: la risoluzione dell'impresa riparte da zero.
        state.quest = makeQuest();
        // Ristoro: +1 Minaccia a tutti i giocatori.
        state.players.forEach((player) => {
          player.threat = Math.min(THREAT_MAX, player.threat + 1);
        });
      });
      playSfx("round");
    } else {
      const target = state.fase + 1;
      mutate(actionLabel("history.phase", { name: phaseName(target) }), () => {
        acceptThreatSetup();
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

  // Icone Radix (MIT): i file stanno in root e il colore arriva dal tema
  // tramite CSS mask (vedi .icon-mask in styles.css).
  const ICON_BOOKMARK =
    '<span class="icon-mask icon-bookmark" aria-hidden="true"></span>';

  const NOTE_ICONS = {
    edit: '<span class="icon-mask icon-pencil" aria-hidden="true"></span>',
    trash: '<span class="icon-mask icon-trash" aria-hidden="true"></span>',
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
        textarea.setAttribute("aria-label", t("ui.noteEditAria", { text: note.text }));

        const actions = document.createElement("div");
        actions.className = "note-actions";
        actions.append(
          noteButton("note-text-btn primary-mini", t("ui.noteSave"), () => {
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
          noteButton("note-text-btn", t("ui.noteCancel"), () => {
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
          noteButton("note-text-btn danger", t("ui.noteDelete"), () => {
            if (!noteScope) return;
            const key = noteKey(noteScope.container, noteScope.anchor);
            notes[key] = (notes[key] || []).filter((item) => item.id !== note.id);
            deletingNoteId = null;
            touchNotes();
            renderNotesSheet();
            vibrate(8);
          }),
          noteButton("note-text-btn", t("ui.noteCancel"), () => {
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
        const edit = noteIconButton("edit", t("ui.noteEditAria", { text: note.text }), () => {
          editingNoteId = note.id;
          deletingNoteId = null;
          renderNotesSheet();
        });
        const remove = noteIconButton("trash", t("ui.noteDeleteAria", { text: note.text }), () => {
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
    el.notesTitle.textContent = t("ui.notesTitle", {
      container: containerTitle(container),
    });
    el.notesSub.textContent = t("ui.notesSub", {
      gap: gapLabel(container, anchor),
    });
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
    el.processTitle.textContent = processName(kind);
    renderProcessList();
    openOverlay(el.processOverlay);
  }

  function closeProcess() {
    activeProcess = null;
    renderedProcessKey = null;
    closeOverlay(el.processOverlay);
  }

  /* ---------- risoluzione dell'impresa ---------- */

  function questDiff() {
    return state.quest.willpower - state.quest.threat;
  }

  function clampWillpower(value) {
    return Math.min(WILLPOWER_MAX, Math.max(WILLPOWER_MIN, value));
  }

  function clampQuestThreat(value) {
    return Math.min(THREAT_MAX, Math.max(0, value));
  }

  function syncQuestInputs() {
    el.questWillpowerInput.value = String(state.quest.willpower);
    el.questThreatInput.value = String(state.quest.threat);
  }

  function setQuestValue(field, value, syncInputs) {
    if (state.quest.applied) return;
    if (field === "willpower") {
      state.quest.willpower = clampWillpower(value);
    } else {
      state.quest.threat = clampQuestThreat(value);
    }
    save();
    if (syncInputs) syncQuestInputs();
    updateQuestResult();
  }

  function updateQuestResult() {
    const diff = questDiff();
    const negative = diff < 0;
    const applied = state.quest.applied;
    const amount = Math.abs(diff);

    el.questProgress.hidden = negative;
    el.questRaise.hidden = !negative;
    el.questRaise.disabled = applied;
    el.questDone.hidden = negative;

    if (!negative) {
      el.questProgressValue.textContent = String(diff);
      el.questProgress.setAttribute(
        "aria-label",
        t("ui.questProgressAria", { n: diff })
      );
    } else {
      el.questRaiseLabel.textContent = applied
        ? t("ui.questRaised", { n: amount })
        : t("ui.questRaiseThreat", { n: amount });
      el.questRaise.setAttribute(
        "aria-label",
        applied
          ? t("ui.questRaised", { n: amount })
          : t("ui.questRaiseThreat", { n: amount })
      );
    }

    // Campi e tasti in sola lettura dopo l'applicazione.
    el.questWillpowerInput.disabled = applied;
    el.questThreatInput.disabled = applied;
    el.questWillpowerMinus.disabled = applied || state.quest.willpower <= WILLPOWER_MIN;
    el.questWillpowerPlus.disabled = applied || state.quest.willpower >= WILLPOWER_MAX;
    el.questThreatMinus.disabled = applied || state.quest.threat <= 0;
    el.questThreatPlus.disabled = applied || state.quest.threat >= THREAT_MAX;

    el.questWillpowerMinus.setAttribute(
      "aria-label",
      t("ui.questMinusAria", { field: t("ui.questWillpower") })
    );
    el.questWillpowerPlus.setAttribute(
      "aria-label",
      t("ui.questPlusAria", { field: t("ui.questWillpower") })
    );
    el.questThreatMinus.setAttribute(
      "aria-label",
      t("ui.questMinusAria", { field: t("ui.questThreat") })
    );
    el.questThreatPlus.setAttribute(
      "aria-label",
      t("ui.questPlusAria", { field: t("ui.questThreat") })
    );

    el.questLock.hidden = !applied;
    if (applied) el.questLock.textContent = t("ui.questLocked");
  }

  function refreshQuestIfOpen() {
    if (el.questOverlay.hidden) return;
    syncQuestInputs();
    updateQuestResult();
  }

  function openQuest() {
    syncQuestInputs();
    updateQuestResult();
    openOverlay(el.questOverlay);
  }

  function stepQuest(field, delta) {
    if (state.quest.applied) return;
    setQuestValue(field, state.quest[field] + delta, true);
    vibrate(4);
  }

  function clearThreatFlash() {
    el.players
      .querySelectorAll(".threat-hit")
      .forEach((card) => card.classList.remove("threat-hit"));
    el.players.querySelectorAll(".threat-float").forEach((node) => node.remove());
  }

  function flashThreat(amount) {
    el.players.querySelectorAll(".counter-player").forEach((card) => {
      card.classList.remove("threat-hit");
      void card.offsetWidth;
      card.classList.add("threat-hit");

      const float = document.createElement("span");
      float.className = "threat-float";
      float.textContent = `+${amount}`;
      float.setAttribute("aria-hidden", "true");
      card.appendChild(float);

      setTimeout(() => {
        card.classList.remove("threat-hit");
        float.remove();
      }, 950);
    });
  }

  function applyQuestThreat() {
    const diff = questDiff();
    if (diff >= 0 || state.quest.applied) return;
    const amount = -diff;

    mutate(actionLabel("history.questThreat", { amount }), () => {
      state.quest.applied = true;
      state.players.forEach((player) => {
        player.threat = Math.min(THREAT_MAX, player.threat + amount);
        // Un aumento esplicito spegne il promemoria della Minaccia iniziale.
        player.setup = true;
      });
    });

    flashThreat(amount);
    // Il popup si chiude da solo: l'effetto si vede sui contatori.
    closeOverlay(el.questOverlay);
    vibrate(12);
  }

  let threatTargetId = null;

  function openThreatDialog(id) {
    const index = playerIndex(id);
    if (index === -1) return;
    threatTargetId = id;
    const player = state.players[index];
    el.threatSub.textContent = t("ui.threatSubNamed", {
      name: playerName(player, index),
    });
    el.threatInput.value = String(player.threat);
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

    const player = playerById(threatTargetId);
    if (!player) return;

    const value = Math.min(THREAT_MAX, Math.max(0, parsed));
    if (value === player.threat) {
      // Confermare lo stesso valore è comunque un'impostazione esplicita.
      if (!player.setup) {
        player.setup = true;
        save();
        render();
      }
      return;
    }

    mutate(actionLabel("history.threat", { value }), () => {
      const target = playerById(threatTargetId);
      if (!target) return;
      target.threat = value;
      target.setup = true;
    });
    vibrate(8);
  }

  let nameTargetId = null;

  function openNameDialog(id) {
    const index = playerIndex(id);
    if (index === -1) return;
    nameTargetId = id;
    const player = state.players[index];
    el.nameTitle.textContent = t("ui.nameDialogTitle", {
      name: playerName(player, index),
    });
    el.nameInput.value = player.name;
    el.nameInput.setAttribute(
      "aria-label",
      t("ui.nameInputAria", { name: playerName(player, index) })
    );
    openOverlay(el.nameOverlay);
    requestAnimationFrame(() => {
      el.nameInput.focus();
      el.nameInput.select();
    });
  }

  function confirmName() {
    closeOverlay(el.nameOverlay);
    const player = playerById(nameTargetId);
    if (!player) return;

    const value = el.nameInput.value
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, PLAYER_NAME_MAX);
    if (value === player.name) return;

    mutate(
      value
        ? actionLabel("history.name", { name: value })
        : actionLabel("history.nameRemoved"),
      () => {
        const target = playerById(nameTargetId);
        if (target) target.name = value;
      }
    );
    vibrate(6);
  }

  function confirmReset() {
    closeOverlay(el.resetOverlay);
    mutate(actionLabel("history.newGame"), () => {
      // Nomi e roster restano: si riparte solo con la minaccia iniziale.
      state.turno = 1;
      state.fase = 0;
      state.bookmark = null;
      state.quest = makeQuest();
      state.players = state.players.map((player) => ({
        ...player,
        threat: THREAT_DEFAULT,
        setup: false,
      }));
    });
    refreshQuestIfOpen();
    // Anche se la Minaccia era già a 30, il promemoria deve ripulsare.
    pulseThreatReminders();
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

  let appW = 0;
  let appH = 0;
  let layoutTimers = [];

  function keyboardOpen() {
    const viewport = window.visualViewport;
    return viewport ? window.innerHeight - viewport.height > 160 : false;
  }

  function measureViewport() {
    const viewport = window.visualViewport;
    // Larghezza/altezza maggiori tra layout e visual viewport: il pinch-zoom
    // non deve rimpicciolire l'app, ma in fullscreen una misura "vecchia"
    // più piccola non deve lasciare spazi vuoti.
    let width = window.innerWidth;
    let height = window.innerHeight;
    if (viewport) {
      width = Math.max(width, Math.round(viewport.width));
      height = Math.max(height, Math.round(viewport.height));
    }

    // In fullscreen il contenuto deve coincidere con lo schermo: su Android
    // innerHeight/visualViewport restano a volte fermi alle misure
    // precedenti, mentre screen è affidabile. Nelle PWA standalone ci
    // limitiamo a non superare lo schermo (c'è ancora la status bar).
    const standalone =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(display-mode: standalone), (display-mode: fullscreen)")
        .matches;
    const screenWidth = window.screen ? Math.round(window.screen.width) : 0;
    const screenHeight = window.screen ? Math.round(window.screen.height) : 0;
    const fullscreen = !!fullscreenElement();

    if (fullscreen && screenWidth > 0 && screenHeight > 0) {
      width = screenWidth;
      height = screenHeight;
    } else if (standalone) {
      if (screenWidth > 0) width = Math.min(width, screenWidth);
      if (screenHeight > 0) height = Math.min(height, screenHeight);
    }

    return {
      width: Math.max(1, width || 0),
      height: Math.max(1, height || 0),
    };
  }

  function updateAppSize() {
    // La tastiera non deve ridimensionare l'app sotto i popup.
    if (keyboardOpen()) return;
    const size = measureViewport();
    if (size.width === appW && size.height === appH) return;
    appW = size.width;
    appH = size.height;
    document.documentElement.style.setProperty("--app-w", `${appW}px`);
    document.documentElement.style.setProperty("--app-h", `${appH}px`);
  }

  function updateTabletMode() {
    // Con la tastiera aperta l'altezza visibile cala: non deve far
    // cambiare modalità mentre si scrive un nome o un valore.
    if (keyboardOpen()) return;

    // Lato corto: stabile in verticale, orizzontale e con la rotazione CSS.
    const shortSide = Math.min(appW || window.innerWidth, appH || window.innerHeight);
    const next = shortSide >= 600;
    if (next === tabletMode) return;

    tabletMode = next;
    document.documentElement.classList.toggle("tablet", tabletMode);
  }

  function layoutClasses() {
    updateAppSize();
    const swapped = rotation === 90;
    const baseW = appW || window.innerWidth;
    const baseH = appH || window.innerHeight;
    const width = swapped ? baseH : baseW;
    const height = swapped ? baseW : baseH;
    updateTabletMode();
    document.documentElement.classList.toggle("narrow", width <= 350);
    document.documentElement.classList.toggle("tight-head", width <= 379);
    document.documentElement.classList.toggle("compact-height", height <= 600);
    document.documentElement.classList.toggle("very-short", height < 480);
    updateRotateLabel();
    updateViewportVars();
    renderPlayers();
  }

  function scheduleLayout() {
    // Dopo il fullscreen Android aggiorna le misure con qualche frame di
    // ritardo: ricalcoliamo subito e poi ancora quando si è assestato.
    layoutClasses();
    layoutTimers.forEach(clearTimeout);
    layoutTimers = [setTimeout(layoutClasses, 260), setTimeout(layoutClasses, 800)];
  }

  function updateRotateLabel() {
    // L'etichetta descrive l'orientamento che si ottiene col prossimo tocco,
    // così resta corretta anche se il telefono è già in orizzontale.
    const rotated = rotation === 90;
    const targetLandscape = rotated
      ? window.innerWidth > window.innerHeight
      : window.innerHeight > window.innerWidth;
    el.rotateBtn.setAttribute(
      "aria-label",
      t(targetLandscape ? "ui.rotateLandscape" : "ui.rotatePortrait")
    );
    el.rotateBtn.title = t(
      targetLandscape ? "ui.rotateTitleLandscape" : "ui.rotateTitlePortrait"
    );
  }

  function applyRotation(value, persist = true) {
    // Solo verticale (0) e orizzontale (90): niente 180°/270°.
    // Gli eventuali valori vecchi vengono riportati ai due stati utili.
    const quarterTurns = Math.round(value / 90);
    rotation = ((quarterTurns % 2) + 2) % 2 === 1 ? 90 : 0;
    el.rotator.dataset.rotation = String(rotation);
    el.rotator.scrollTop = 0;
    // Ricalcolo immediato + assestamento: in fullscreen Android le misure
    // del viewport possono aggiornarsi solo dopo il tocco.
    scheduleLayout();

    if (persist) {
      save();
      vibrate(6);
    }
  }

  /* ---------- fullscreen ---------- */

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
    // Il pulsante fullscreen è commentato in index.html (al suo posto c'è il
    // selettore lingua). Il codice resta pronto per riattivarlo.
    if (!fullscreenSupported || !el.fullscreenBtn) return;
    const active = !!fullscreenElement();
    const label = t(active ? "ui.fullscreenExit" : "ui.fullscreenEnter");
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
    // Il viewport in fullscreen può cambiare con qualche frame di ritardo.
    scheduleLayout();
  }

  /* ---------- wake lock ---------- */

  let wakeLock = null;
  let wakeRequest = null;
  let wakeMode = "off";

  function setWakeBadge(mode) {
    wakeMode = mode;
    el.wakeBadge.dataset.state = mode;

    if (mode === "unsupported") {
      el.wakeText.textContent = t("ui.wakeUnsupported");
      el.wakeBadge.title = t("ui.wakeUnsupportedTitle");
      el.wakeBadge.setAttribute("aria-label", t("ui.wakeUnsupportedAria"));
      el.wakeBadge.setAttribute("aria-disabled", "true");
      el.wakeBadge.removeAttribute("aria-pressed");
      return;
    }

    el.wakeBadge.removeAttribute("aria-disabled");
    const active = mode === "on";
    el.wakeText.textContent = t(active ? "ui.wakeOn" : "ui.wakeOff");
    el.wakeBadge.setAttribute("aria-pressed", String(active));
    el.wakeBadge.setAttribute(
      "aria-label",
      t(active ? "ui.wakeOnAria" : "ui.wakeOffAria")
    );
    el.wakeBadge.title = t(active ? "ui.wakeOnTitle" : "ui.wakeOffTitle");
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
  lang = detectLanguage();
  applyStaticTexts();
  updateLanguageButton();
  applyRotation(rotation, false);
  buildStepper();
  render();
  pulseThreatReminders();

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

  bindCounterButton(el.turnoMinus, turnoCounter, -1);
  bindCounterButton(el.turnoPlus, turnoCounter, 1);

  el.next.addEventListener("click", advance);

  el.rotateBtn.addEventListener("click", () => applyRotation(rotation === 0 ? 90 : 0));
  if (el.langBtn) el.langBtn.addEventListener("click", cycleLanguage);
  el.wakeBadge.addEventListener("click", toggleWakeLock);

  // Il pulsante fullscreen è commentato in index.html: se viene riattivato,
  // questo blocco lo collega senza altre modifiche.
  if (el.fullscreenBtn) {
    el.fullscreenBtn.addEventListener("click", toggleFullscreen);
    if (!fullscreenSupported) {
      el.fullscreenBtn.hidden = true;
    } else {
      updateFullscreenButton();
    }
  }
  document.addEventListener("fullscreenchange", () => {
    updateFullscreenButton();
    scheduleLayout();
  });
  document.addEventListener("webkitfullscreenchange", () => {
    updateFullscreenButton();
    scheduleLayout();
  });

  document.addEventListener(
    "pointerdown",
    (event) => {
      const button =
        event.target instanceof Element ? event.target.closest("button") : null;
      if (button && !button.disabled && button !== el.undo) playSfx("tap");
    },
    { capture: true, passive: true }
  );

  document.addEventListener("keydown", (event) => {
    if (event.repeat) return;
    if (event.key !== "Enter" && event.key !== " " && event.key !== "Spacebar") return;
    const button =
      event.target instanceof Element ? event.target.closest("button") : null;
    if (button && !button.disabled && button !== el.undo) playSfx("tap");
  });

  el.notesClose.addEventListener("click", closeNotesSheet);
  el.processClose.addEventListener("click", closeProcess);
  el.questClose.addEventListener("click", () => closeOverlay(el.questOverlay));
  el.questDone.addEventListener("click", () => closeOverlay(el.questOverlay));
  el.questRaise.addEventListener("click", applyQuestThreat);
  el.questWillpowerMinus.addEventListener("click", () => stepQuest("willpower", -1));
  el.questWillpowerPlus.addEventListener("click", () => stepQuest("willpower", 1));
  el.questThreatMinus.addEventListener("click", () => stepQuest("threat", -1));
  el.questThreatPlus.addEventListener("click", () => stepQuest("threat", 1));

  function bindQuestInput(input, field, allowNegative, maxLength) {
    input.addEventListener("input", () => {
      let text = input.value.replace(allowNegative ? /[^\d-]/g : /\D/g, "");
      if (allowNegative) text = text.replace(/(?!^)-/g, "");
      if (text.length > maxLength) text = text.slice(0, maxLength);
      input.value = text;
      const parsed = text === "" || text === "-" ? 0 : Number.parseInt(text, 10);
      setQuestValue(field, parsed, false);
    });
    input.addEventListener("blur", syncQuestInputs);
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        input.blur();
      }
    });
  }

  bindQuestInput(el.questWillpowerInput, "willpower", true, 4);
  bindQuestInput(el.questThreatInput, "threat", false, 3);
  el.notesForm.addEventListener("submit", (event) => {
    event.preventDefault();
    addNote();
  });
  el.notesInput.addEventListener("input", updateNotesComposer);

  el.undo.addEventListener("click", () => {
    const entry = history.pop();
    if (!entry) return;
    playSfx("undo");
    const hadPending = state.players.some((player) => !player.setup);
    state = sanitize(entry.state);
    save();
    clearThreatFlash();
    render();
    refreshQuestIfOpen();
    // Se l'undo fa ricomparire il promemoria, rilancialo una volta.
    if (!hadPending && state.players.some((player) => !player.setup)) {
      pulseThreatReminders();
    }
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

  el.nameCancel.addEventListener("click", () => closeOverlay(el.nameOverlay));
  el.nameConfirm.addEventListener("click", confirmName);
  el.nameInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      confirmName();
    }
  });
  el.nameInput.addEventListener("input", () => {
    // Un solo spazio alla volta, niente spazi iniziali.
    el.nameInput.value = el.nameInput.value.replace(/\s+/g, " ").replace(/^\s+/, "");
  });

  [
    el.threatOverlay,
    el.resetOverlay,
    el.notesOverlay,
    el.processOverlay,
    el.questOverlay,
    el.nameOverlay,
  ].forEach((overlay) => {
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
  });

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
  window.addEventListener("orientationchange", scheduleLayout);
  if (
    window.screen &&
    window.screen.orientation &&
    typeof window.screen.orientation.addEventListener === "function"
  ) {
    window.screen.orientation.addEventListener("change", scheduleLayout);
  }
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
