import type { ProcessKind } from "@/lib/types";

export type NotesScope = {
  container: string;
  anchor: string;
};

export type DialogState = {
  process: ProcessKind | null;
  quest: boolean;
  notes: NotesScope | null;
  threat: string | null;
  name: string | null;
  reset: boolean;
};

export const emptyDialogs: DialogState = {
  process: null,
  quest: false,
  notes: null,
  threat: null,
  name: null,
  reset: false,
};

export const anyDialogOpen = (state: DialogState): boolean =>
  state.process !== null ||
  state.quest ||
  state.notes !== null ||
  state.threat !== null ||
  state.name !== null ||
  state.reset;
