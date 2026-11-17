import { THREAT_DEFAULT, THREAT_MAX, WILLPOWER_MAX, WILLPOWER_MIN } from "./constants";
import { translate } from "./i18n";
import type { GameState, Player, Quest } from "./types";

export const makeId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

export const makePlayer = (name = "", setup = false): Player => ({
  id: makeId(),
  name,
  threat: THREAT_DEFAULT,
  setup,
});

export const makeQuest = (): Quest => ({ willpower: 0, threat: 0, applied: false });

export const initialState = (): GameState => ({
  turno: 1,
  fase: 0,
  players: [makePlayer()],
  bookmark: null,
  quest: makeQuest(),
});

export const cloneState = (source: GameState): GameState => ({
  turno: source.turno,
  fase: source.fase,
  players: source.players.map((player) => ({ ...player })),
  bookmark: source.bookmark ? { ...source.bookmark } : null,
  quest: source.quest ? { ...source.quest } : makeQuest(),
});

export const playerName = (lang: string, player: Player | null | undefined, index: number): string => {
  const name = player && typeof player.name === "string" ? player.name.trim() : "";
  return name || translate(lang, "ui.playerDefault", { n: index + 1 });
};

export const acceptThreatSetup = (draft: GameState): void => {
  draft.players.forEach((player) => {
    if (!player.setup) player.setup = true;
  });
};

export const clampThreat = (value: number): number =>
  Math.min(THREAT_MAX, Math.max(0, Math.floor(value)));

export const clampWillpower = (value: number): number =>
  Math.min(WILLPOWER_MAX, Math.max(WILLPOWER_MIN, Math.floor(value)));

export const clampQuestThreat = (value: number): number =>
  Math.min(THREAT_MAX, Math.max(0, Math.floor(value)));
