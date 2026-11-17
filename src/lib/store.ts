import { useSyncExternalStore } from "react";
import {
  HISTORY_LIMIT,
  PLAYER_LIMIT,
  THREAT_DEFAULT,
  THREAT_MAX,
} from "./constants";
import { actionLabel, detectLanguage } from "./i18n";
import { acceptThreatSetup, clampThreat, cloneState, makePlayer, makeQuest } from "./game";
import { loadDocument, noteKey, sanitize, saveDocument } from "./storage";
import type {
  ActionLabel,
  GameState,
  HistoryEntry,
  Note,
  NotesMap,
  Rotation,
  StoredDocument,
} from "./types";

export type StoreState = {
  game: GameState;
  history: HistoryEntry[];
  notes: NotesMap;
  wake: boolean;
  rotation: Rotation;
  lang: string;
};

type Listener = () => void;

const documentFromState = (state: StoreState): StoredDocument => ({
  state: state.game,
  history: state.history,
  notes: state.notes,
  wake: state.wake,
  rotation: state.rotation,
  lang: state.lang,
});

export const createStore = (initialState: StoreState) => {
  let state = initialState;
  const listeners = new Set<Listener>();

  const emit = (persist: boolean) => {
    if (persist) saveDocument(documentFromState(state));
    state = { ...state };
    listeners.forEach((listener) => listener());
  };

  const setState = (patch: Partial<StoreState>, persist = true) => {
    state = { ...state, ...patch };
    emit(persist);
  };

  const mutate = (label: ActionLabel, apply: (draft: GameState) => void) => {
    const snapshot = cloneState(state.game);
    const draft = cloneState(state.game);
    apply(draft);
    const nextGame = sanitize(draft);
    const history = [...state.history, { state: snapshot, label }].slice(-HISTORY_LIMIT);
    setState({ game: nextGame, history });
  };

  const setGame = (apply: (draft: GameState) => void, persist = true) => {
    const draft = cloneState(state.game);
    apply(draft);
    setState({ game: sanitize(draft) }, persist);
  };

  const pushHistory = (snapshot: GameState, label: ActionLabel) => {
    setState({
      history: [...state.history, { state: snapshot, label }].slice(-HISTORY_LIMIT),
    });
  };

  const updateNotes = (apply: (draft: NotesMap) => void) => {
    const draft = JSON.parse(JSON.stringify(state.notes)) as NotesMap;
    apply(draft);
    const clean = sanitizeNotesForState(draft);
    setState({ notes: clean });
  };

  const undo = (): { hadPending: boolean; hasPending: boolean } => {
    const entry = state.history[state.history.length - 1];
    const hadPending = state.game.players.some((player) => !player.setup);
    if (!entry) return { hadPending, hasPending: hadPending };
    setState({
      game: sanitize(entry.state),
      history: state.history.slice(0, -1),
    });
    return {
      hadPending,
      hasPending: sanitize(entry.state).players.some((player) => !player.setup),
    };
  };

  const nextTurn = () => {
    const nextTurno = state.game.turno + 1;
    mutate(actionLabel("history.turn", { n: nextTurno }), (draft) => {
      acceptThreatSetup(draft);
      draft.turno = nextTurno;
      draft.fase = 0;
      draft.quest = makeQuest();
      draft.players.forEach((player) => {
        player.threat = Math.min(THREAT_MAX, player.threat + 1);
      });
    });
  };

  const addPlayer = () => {
    if (state.game.players.length >= PLAYER_LIMIT) return null;
    const player = makePlayer();
    mutate(actionLabel("history.addPlayer"), (draft) => {
      draft.players.push(player);
    });
    return player.id;
  };

  const removePlayer = (id: string, name: string) => {
    if (state.game.players.length <= 1) return;
    mutate(actionLabel("history.removePlayer", { name }), (draft) => {
      draft.players = draft.players.filter((player) => player.id !== id);
    });
  };

  const resetGame = () => {
    mutate(actionLabel("history.newGame"), (draft) => {
      draft.turno = 1;
      draft.fase = 0;
      draft.bookmark = null;
      draft.quest = makeQuest();
      draft.players = draft.players.map((player) => ({
        ...player,
        threat: THREAT_DEFAULT,
        setup: false,
      }));
    });
  };

  const applyQuestThreat = (amount: number) => {
    mutate(actionLabel("history.questThreat", { amount }), (draft) => {
      draft.quest.applied = true;
      draft.players.forEach((player) => {
        player.threat = Math.min(THREAT_MAX, player.threat + amount);
        player.setup = true;
      });
    });
  };

  const setThreat = (id: string, value: number) => {
    mutate(actionLabel("history.threat", { value }), (draft) => {
      const player = draft.players.find((item) => item.id === id);
      if (!player) return;
      player.threat = clampThreat(value);
      player.setup = true;
    });
  };

  const confirmSameThreat = (id: string) => {
    setGame((draft) => {
      const player = draft.players.find((item) => item.id === id);
      if (player) player.setup = true;
    });
  };

  const setName = (id: string, value: string) => {
    const label = value
      ? actionLabel("history.name", { name: value })
      : actionLabel("history.nameRemoved");
    mutate(label, (draft) => {
      const player = draft.players.find((item) => item.id === id);
      if (player) player.name = value;
    });
  };

  const toggleBookmark = (container: string, step: string) => {
    setGame((draft) => {
      const same =
        !!draft.bookmark &&
        draft.bookmark.container === container &&
        draft.bookmark.step === step;
      draft.bookmark = same ? null : { container, step };
    });
  };

  return {
    subscribe: (listener: Listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: () => state,
    mutate,
    setGame,
    pushHistory,
    updateNotes,
    undo,
    nextTurn,
    addPlayer,
    removePlayer,
    resetGame,
    applyQuestThreat,
    setThreat,
    confirmSameThreat,
    setName,
    toggleBookmark,
    setLang: (lang: string) => setState({ lang }),
    setWake: (wake: boolean) => setState({ wake }),
    setRotation: (rotation: Rotation) => setState({ rotation }),
    snapshotGame: () => cloneState(state.game),
    getNotes: (container: string, anchor: string): Note[] =>
      state.notes[noteKey(container, anchor)] || [],
  };
};

export type GameStore = ReturnType<typeof createStore>;


const sanitizeNotesForState = (notes: NotesMap): NotesMap => {
  const clean: NotesMap = {};
  Object.entries(notes).forEach(([key, list]) => {
    const filtered = list.filter((note) => note.text.trim().length > 0);
    if (filtered.length > 0) clean[key] = filtered;
  });
  return clean;
};

const loaded = loadDocument();
const initialLang = detectLanguage(loaded.hadSavedLanguage ? loaded.lang : undefined);

export const store = createStore({
  game: loaded.state,
  history: loaded.history,
  notes: loaded.notes,
  wake: loaded.wake,
  rotation: loaded.rotation,
  lang: initialLang,
});

export const useStore = <T,>(selector: (state: StoreState) => T): T =>
  useSyncExternalStore(
    store.subscribe,
    () => selector(store.getSnapshot()),
    () => selector(store.getSnapshot())
  );
