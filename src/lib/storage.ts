import {
  FASI,
  HISTORY_LIMIT,
  LEGACY_STORAGE_KEY,
  NOTE_LIMIT,
  NOTES_PER_GAP,
  PLAYER_LIMIT,
  PLAYER_NAME_MAX,
  STORAGE_KEY,
  THREAT_DEFAULT,
  THREAT_MAX,
  WILLPOWER_MAX,
  WILLPOWER_MIN,
  blocksFor,
  isKnownContainer,
} from "./constants";
import { cloneState, initialState, makeId } from "./game";
import { I18N, DEFAULT_LANG } from "./i18n";
import type {
  ActionLabel,
  Bookmark,
  GameState,
  HistoryEntry,
  LoadedDocument,
  Note,
  NotesMap,
  Player,
  Quest,
  Rotation,
  StoredDocument,
} from "./types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object";

export const sanitizePlayer = (raw: unknown): Player => {
  const source = isRecord(raw) ? raw : {};
  const name =
    typeof source.name === "string" ? source.name.trim().slice(0, PLAYER_NAME_MAX) : "";
  const threat = Math.floor(Number(source.threat));
  return {
    id: typeof source.id === "string" && source.id ? source.id : makeId(),
    name,
    threat: Number.isFinite(threat) ? Math.min(THREAT_MAX, Math.max(0, threat)) : THREAT_DEFAULT,
    setup: typeof source.setup === "boolean" ? source.setup : true,
  };
};

export const validStep = (container: string, stepId: string): boolean =>
  blocksFor(container).some((block) => block.kind === "step" && block.id === stepId);

export const sanitizeBookmark = (raw: unknown): Bookmark => {
  if (!isRecord(raw)) return null;
  const container = typeof raw.container === "string" ? raw.container : "";
  const stepId = typeof raw.step === "string" ? raw.step : "";
  if (!isKnownContainer(container) || !validStep(container, stepId)) return null;
  return { container, step: stepId };
};

export const sanitizeQuest = (raw: unknown): Quest => {
  const source = isRecord(raw) ? raw : {};
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
    applied: Boolean(source.applied) && value < staging,
  };
};

export const sanitizeActionLabel = (raw: unknown): ActionLabel => {
  if (typeof raw === "string") return raw;
  if (isRecord(raw) && typeof raw.key === "string") {
    const vars: Record<string, string | number> = {};
    if (isRecord(raw.vars)) {
      Object.entries(raw.vars).forEach(([key, value]) => {
        if (typeof value === "string" || typeof value === "number") {
          vars[key] = value;
        }
      });
    }
    return { key: raw.key, vars };
  }
  return "";
};

export const sanitize = (raw: unknown): GameState => {
  const source = isRecord(raw) ? raw : {};
  const turno = Math.floor(Number(source.turno));
  const fase = Math.floor(Number(source.fase));

  let players: Player[] = [];
  if (Array.isArray(source.players) && source.players.length > 0) {
    players = source.players.slice(0, PLAYER_LIMIT).map((player) => sanitizePlayer(player));
  } else {
    const minaccia = Math.floor(Number(source.minaccia));
    const threatSetup = typeof source.threatSetup === "boolean" ? source.threatSetup : true;
    players = [
      sanitizePlayer({
        threat: Number.isFinite(minaccia) ? minaccia : THREAT_DEFAULT,
        setup: threatSetup,
      }),
    ];
  }

  return {
    turno: Number.isFinite(turno) ? Math.max(1, turno) : 1,
    fase: Number.isFinite(fase) ? Math.min(FASI.length - 1, Math.max(0, fase)) : 0,
    players,
    bookmark: sanitizeBookmark(source.bookmark),
    quest: sanitizeQuest(source.quest),
  };
};

export const cloneGame = cloneState;

export const validAnchors = (container: string): Set<string> => {
  const anchors = new Set(["end"]);
  blocksFor(container)
    .slice(0, -1)
    .forEach((block) => anchors.add(block.id));
  return anchors;
};

export const noteKey = (container: string, anchor: string): string => `${container}::${anchor}`;

export const sanitizeNotes = (raw: unknown): NotesMap => {
  const clean: NotesMap = {};
  if (!isRecord(raw)) return clean;

  Object.entries(raw).forEach(([key, value]) => {
    if (!Array.isArray(value)) return;
    const split = key.indexOf("::");
    const container = split === -1 ? key : key.slice(0, split);
    const anchor = split === -1 ? "end" : key.slice(split + 2);
    if (!isKnownContainer(container) || !validAnchors(container).has(anchor)) return;

    const list = value
      .filter((note): note is Note => isRecord(note) && typeof note.text === "string")
      .map((note) => ({
        id: typeof note.id === "string" && note.id ? note.id : makeId(),
        text: note.text.slice(0, NOTE_LIMIT).trim(),
        ...(note.hidden === true ? { hidden: true } : {}),
      }))
      .filter((note) => note.text.length > 0)
      .slice(0, NOTES_PER_GAP);

    if (list.length > 0) clean[noteKey(container, anchor)] = list;
  });

  return clean;
};

const normalizeRotation = (value: unknown): Rotation =>
  [90, 270].includes(Number(value)) ? 90 : 0;

const defaultDocument = (): StoredDocument => ({
  state: initialState(),
  history: [],
  notes: {},
  wake: true,
  rotation: 0,
  lang: DEFAULT_LANG,
});

const sanitizeHistory = (raw: unknown): HistoryEntry[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (entry): entry is { state: unknown; label: unknown } =>
        isRecord(entry) && !!entry.state && !!entry.label
    )
    .slice(-HISTORY_LIMIT)
    .map((entry) => ({
      state: sanitize(entry.state),
      label: sanitizeActionLabel(entry.label),
    }));
};

export const loadDocument = (): LoadedDocument => {
  const fallback = defaultDocument();
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    const usedLegacy = !raw;
    if (!raw) raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) {
      return { ...fallback, hadSavedLanguage: false };
    }

    const data: unknown = JSON.parse(raw);
    if (!isRecord(data)) return { ...fallback, hadSavedLanguage: false };

    const savedLang =
      typeof data.lang === "string" && (I18N as Record<string, unknown>)[data.lang]
        ? data.lang
        : null;

    const document: LoadedDocument = {
      state: data.state ? sanitize(data.state) : fallback.state,
      history: sanitizeHistory(data.history),
      notes: sanitizeNotes(data.notes),
      wake: typeof data.wake === "boolean" ? data.wake : true,
      rotation: normalizeRotation(data.rotation),
      lang: savedLang ?? DEFAULT_LANG,
      hadSavedLanguage: savedLang !== null,
    };

    if (usedLegacy) saveDocument(document);
    return document;
  } catch {
    return { ...fallback, hadSavedLanguage: false };
  }
};

export const saveDocument = (document: StoredDocument): void => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        state: document.state,
        history: document.history,
        notes: document.notes,
        wake: document.wake,
        rotation: document.rotation,
        lang: document.lang,
      })
    );
  } catch {
    /* quota o modalità privata: ignorato */
  }
};

