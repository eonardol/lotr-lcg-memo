export type Player = {
  id: string;
  name: string;
  threat: number;
  setup: boolean;
};

export type Bookmark = {
  container: string;
  step: string;
} | null;

export type Quest = {
  willpower: number;
  threat: number;
  applied: boolean;
};

export type GameState = {
  turno: number;
  fase: number;
  players: Player[];
  bookmark: Bookmark;
  quest: Quest;
};

export type ActionLabel = string | { key: string; vars?: Record<string, string | number> };

export type HistoryEntry = {
  state: GameState;
  label: ActionLabel;
};

export type Note = {
  id: string;
  text: string;
  /** Facoltativo: le note nascoste restano salvate ma non compaiono nei passi. */
  hidden?: boolean;
};

export type NotesMap = Record<string, Note[]>;

export type Rotation = 0 | 90;

export type ProcessKind = "nemici" | "giocatori";

export type StepBlock = {
  id: string;
  kind: "step";
  process?: ProcessKind;
  quest?: boolean;
};

export type WindowBlock = {
  id: string;
  kind: "window";
};

export type Block = StepBlock | WindowBlock;

export type StoredDocument = {
  state: GameState;
  history: HistoryEntry[];
  notes: NotesMap;
  wake: boolean;
  rotation: Rotation;
  lang: string;
};

export type LoadedDocument = StoredDocument & {
  hadSavedLanguage: boolean;
};
