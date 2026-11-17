import type { Block, ProcessKind } from "./types";

export const STORAGE_KEY = "rings-turn-log/v1";
export const LEGACY_STORAGE_KEY = "lotr-lcg-memo/v1";

export const HISTORY_LIMIT = 30;
export const NOTE_LIMIT = 240;
export const NOTES_PER_GAP = 30;
export const THREAT_ALERT = 50;
export const THREAT_DEFAULT = 30;
export const THREAT_MAX = 999;
export const WILLPOWER_MIN = -999;
export const WILLPOWER_MAX = 999;
export const PLAYER_LIMIT = 4;
export const PLAYER_NAME_MAX = 18;

const step = (id: string, options: Partial<Block> = {}): Block => ({
  id,
  kind: "step",
  ...options,
});
const actionWindow = (id: string): Block => ({ id, kind: "window" });

export const FASI: { blocks: Block[] }[] = [
  {
    blocks: [step("1.1"), step("1.2"), step("1.3"), actionWindow("w-1"), step("1.4")],
  },
  {
    blocks: [step("2.1"), step("2.2"), step("2.3"), step("2.4")],
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
    blocks: [step("4.1"), step("4.2"), actionWindow("w-1"), step("4.3")],
  },
  {
    blocks: [step("5.1"), step("5.2"), actionWindow("w-1"), step("5.3"), actionWindow("w-2"), step("5.4")],
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
      actionWindow("w-2"),
      step("6.7"),
      step("6.8a", { process: "giocatori" }),
      step("6.9"),
      step("6.10"),
      step("6.11"),
    ],
  },
  {
    blocks: [step("7.1"), step("7.2"), step("7.3"), step("7.4"), actionWindow("w-1"), step("7.5")],
  },
];

export const PROCESSI: Record<ProcessKind, { blocks: Block[] }> = {
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

export const LAST_PHASE = FASI.length - 1;
export const PROCESSI_FASE: Record<number, ProcessKind[]> = {
  5: ["nemici", "giocatori"],
};

export const isProcessContainer = (container: string): boolean =>
  container.startsWith("proc:");

export const blocksFor = (container: string): Block[] => {
  if (isProcessContainer(container)) {
    const process = PROCESSI[container.slice(5) as ProcessKind];
    return process ? process.blocks : [];
  }
  const phase = FASI[Number(container)];
  return phase ? phase.blocks : [];
};

export const isKnownContainer = (container: string): boolean => {
  if (isProcessContainer(container)) {
    return !!PROCESSI[container.slice(5) as ProcessKind];
  }
  return /^\d+$/.test(container) && FASI[Number(container)] !== undefined;
};
