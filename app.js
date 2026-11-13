(() => {
  "use strict";

  const PHASES = [
    { name: "Risorsa", desc: "Aggiungi 1 risorsa a ogni eroe; puoi giocare un attaccamento" },
    { name: "Pianificazione", desc: "Gioca alleati e attaccamenti spendendo risorse" },
    { name: "Impresa", desc: "Impegna personaggi, rivela la carta incontro, risolvi l'impresa" },
    { name: "Viaggio", desc: "Scegli un luogo e mettilo come luogo attivo" },
    { name: "Incontro", desc: "Scegli un nemico o pesca una carta incontro" },
    { name: "Combattimento", desc: "I nemici attaccano, poi attacchi tu; assegna i danni" },
    { name: "Ristoro", desc: "Raddrizza le carte esaurite, passa il segnalino primo giocatore" },
  ];

  const STORAGE_KEY = "lotr-lcg-memo/v1";
  const HISTORY_LIMIT = 30;
  const NOTE_LIMIT = 240;
  const THREAT_ALERT = 50;
  const LAST_PHASE = PHASES.length - 1;

  const $ = (id) => document.getElementById(id);

  const el = {
    wakeBadge: $("wakeBadge"),
    wakeText: $("wakeText"),
    turnoValue: $("turnoValue"),
    minacciaValue: $("minacciaValue"),
    turnoMinus: $("turnoMinus"),
    turnoPlus: $("turnoPlus"),
    minacciaMinus: $("minacciaMinus"),
    minacciaPlus: $("minacciaPlus"),
    stepper: $("stepper"),
    phaseNum: $("phaseNum"),
    phaseName: $("phaseName"),
    phaseDesc: $("phaseDesc"),
    next: $("next"),
    nextHint: $("nextHint"),
    undo: $("undo"),
    undoLabel: $("undoLabel"),
    reset: $("reset"),
    notesBtn: $("notesBtn"),
    notesBtnLabel: $("notesBtnLabel"),
    phaseNotes: $("phaseNotes"),
    phaseNotesList: $("phaseNotesList"),
    notesOverlay: $("notesOverlay"),
    notesTitle: $("notesTitle"),
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

  const initialState = () => ({ turno: 1, minaccia: 30, fase: 0 });

  let state = initialState();
  let history = [];
  let notes = {};
  let editingNoteId = null;
  let deletingNoteId = null;
  let lastRendered = null;
  let activeOverlay = null;
  let overlayReturnFocus = null;

  /* ---------- persistence ---------- */

  function sanitize(raw) {
    const turno = Math.floor(Number(raw && raw.turno));
    const minaccia = Math.floor(Number(raw && raw.minaccia));
    const fase = Math.floor(Number(raw && raw.fase));
    return {
      turno: Number.isFinite(turno) ? Math.max(1, turno) : 1,
      minaccia: Number.isFinite(minaccia) ? Math.max(0, minaccia) : 30,
      fase: Number.isFinite(fase) ? Math.min(LAST_PHASE, Math.max(0, fase)) : 0,
    };
  }

  function makeId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function sanitizeNotes(raw) {
    const clean = {};
    if (!raw || typeof raw !== "object") return clean;

    for (let index = 0; index <= LAST_PHASE; index += 1) {
      const list = raw[String(index)];
      if (!Array.isArray(list)) continue;

      const phaseNotes = list
        .filter((note) => note && typeof note.text === "string")
        .map((note) => ({
          id: typeof note.id === "string" && note.id ? note.id : makeId(),
          text: note.text.slice(0, NOTE_LIMIT).trim(),
        }))
        .filter((note) => note.text.length > 0)
        .slice(0, 30);

      if (phaseNotes.length > 0) clean[String(index)] = phaseNotes;
    }
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
    } catch (error) {
      /* storage non disponibile: si continua senza persistenza */
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ state, history, notes }));
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
    const turnoChanged = !lastRendered || lastRendered.turno !== state.turno;
    const minacciaChanged = !lastRendered || lastRendered.minaccia !== state.minaccia;

    el.turnoValue.textContent = String(state.turno);
    el.minacciaValue.textContent = String(state.minaccia);
    el.turnoValue.classList.toggle("long", String(state.turno).length > 2);
    el.minacciaValue.classList.toggle("long", String(state.minaccia).length > 2);
    el.minacciaValue.setAttribute(
      "aria-label",
      `Minaccia ${state.minaccia}${state.minaccia >= THREAT_ALERT ? ", livello di allarme" : ""}. Tocca per impostare un valore`
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
      pill.classList.toggle("has-notes", (notes[String(index)] || []).length > 0);
      if (current) {
        pill.setAttribute("aria-current", "step");
      } else {
        pill.removeAttribute("aria-current");
      }
    });

    const phase = PHASES[state.fase];
    el.phaseNum.textContent = String(state.fase + 1);
    el.phaseName.textContent = phase.name;
    el.phaseDesc.textContent = phase.desc;
    renderNotesPreview();

    if (state.fase === LAST_PHASE) {
      el.nextHint.textContent = `→ Turno ${state.turno + 1} · Minaccia ${state.minaccia + 1}`;
    } else {
      el.nextHint.textContent = `→ ${PHASES[state.fase + 1].name}`;
    }

    const last = history[history.length - 1];
    el.undo.disabled = !last;
    el.undoLabel.textContent = last ? last.label : "Annulla";
    el.undo.setAttribute(
      "aria-label",
      last ? `Annulla: ${last.label}` : "Nessuna azione da annullare"
    );

    lastRendered = { turno: state.turno, minaccia: state.minaccia };
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
      counter.set(Math.max(counter.min, counter.get() + delta));
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
    PHASES.forEach((phase, index) => {
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
    } else {
      const target = state.fase + 1;
      mutate(`Fase ${PHASES[target].name}`, () => {
        state.fase = target;
      });
    }
    vibrate(12);
  }

  /* ---------- notes ---------- */

  function phaseNotes() {
    return notes[String(state.fase)] || [];
  }

  function touchNotes() {
    const key = String(state.fase);
    if (notes[key] && notes[key].length === 0) delete notes[key];
    save();
    render();
  }

  function renderNotesPreview() {
    const list = phaseNotes();
    el.phaseNotes.hidden = list.length === 0;
    el.phaseNotesList.replaceChildren();

    list.forEach((note) => {
      const item = document.createElement("li");
      item.textContent = note.text;
      el.phaseNotesList.appendChild(item);
    });

    if (list.length > 0) {
      el.notesBtnLabel.textContent = `✎ Note (${list.length})`;
      el.notesBtn.setAttribute(
        "aria-label",
        `Modifica le note della fase ${PHASES[state.fase].name}`
      );
    } else {
      el.notesBtnLabel.textContent = "＋ Aggiungi nota";
      el.notesBtn.setAttribute(
        "aria-label",
        `Aggiungi una nota alla fase ${PHASES[state.fase].name}`
      );
    }
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
    const list = phaseNotes();
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
            const key = String(state.fase);
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

  function openNotesSheet() {
    editingNoteId = null;
    deletingNoteId = null;
    el.notesTitle.textContent = `Note · ${PHASES[state.fase].name}`;
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
    const text = el.notesInput.value.trim().slice(0, NOTE_LIMIT);
    if (!text) {
      el.notesInput.focus();
      return;
    }

    const key = String(state.fase);
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
    overlayReturnFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    activeOverlay = overlay;
    overlay.hidden = false;
    document.body.classList.add("modal-open");
  }

  function closeOverlay(overlay) {
    overlay.hidden = true;
    if (activeOverlay === overlay) activeOverlay = null;
    if (!document.querySelector(".overlay:not([hidden])")) {
      document.body.classList.remove("modal-open");
      if (overlayReturnFocus) {
        overlayReturnFocus.focus();
        overlayReturnFocus = null;
      }
    }
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
    if (value === state.minaccia) return;

    mutate(`Minaccia ${value}`, () => {
      state.minaccia = value;
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

  /* ---------- wake lock ---------- */

  let wakeLock = null;
  let wakeRequest = null;

  function setWakeBadge(mode) {
    el.wakeBadge.dataset.state = mode;
    if (mode === "on") {
      el.wakeText.textContent = "Schermo attivo";
      el.wakeBadge.title = "Blocco schermo disattivato";
    } else if (mode === "unsupported") {
      el.wakeText.textContent = "Schermo non bloccato";
      el.wakeBadge.title = "Questo browser non supporta il blocco dello schermo";
    } else {
      el.wakeText.textContent = "Tocca per attivare";
      el.wakeBadge.title = "Tocca lo schermo per impedirne lo spegnimento";
    }
  }

  async function ensureWakeLock() {
    if (!("wakeLock" in navigator)) {
      setWakeBadge("unsupported");
      return;
    }
    if (wakeLock || wakeRequest || document.visibilityState !== "visible") return;

    wakeRequest = navigator.wakeLock
      .request("screen")
      .then((lock) => {
        wakeLock = lock;
        setWakeBadge("on");
        lock.addEventListener("release", () => {
          wakeLock = null;
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

  /* ---------- init ---------- */

  load();
  buildStepper();
  render();

  bindCounterButton(el.turnoMinus, "turno", -1);
  bindCounterButton(el.turnoPlus, "turno", 1);
  bindCounterButton(el.minacciaMinus, "minaccia", -1);
  bindCounterButton(el.minacciaPlus, "minaccia", 1);

  el.next.addEventListener("click", advance);
  el.minacciaValue.addEventListener("click", openThreatDialog);

  el.notesBtn.addEventListener("click", openNotesSheet);
  el.notesClose.addEventListener("click", closeNotesSheet);
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

  [el.threatOverlay, el.resetOverlay, el.notesOverlay].forEach((overlay) => {
    overlay.addEventListener("click", (event) => {
      if (event.target !== overlay) return;
      if (overlay === el.notesOverlay) {
        closeNotesSheet();
      } else {
        closeOverlay(overlay);
      }
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;

    if (activeOverlay === el.notesOverlay && (editingNoteId || deletingNoteId)) {
      editingNoteId = null;
      deletingNoteId = null;
      renderNotesSheet();
      return;
    }

    if (activeOverlay === el.notesOverlay) {
      closeNotesSheet();
      return;
    }

    if (activeOverlay) closeOverlay(activeOverlay);
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") ensureWakeLock();
  });

  window.addEventListener("pointerdown", ensureWakeLock, { passive: true });
  window.addEventListener("focus", ensureWakeLock);

  if (!("wakeLock" in navigator)) {
    setWakeBadge("unsupported");
  } else if (document.visibilityState === "visible") {
    ensureWakeLock();
  }
})();
