import { PROCESSI, PROCESSI_FASE, blocksFor, isProcessContainer } from "./constants";
import { processName, phaseName, translate } from "./i18n";
import type { Bookmark, NotesMap, ProcessKind } from "./types";

export const containerTitle = (lang: string, container: string): string => {
  if (isProcessContainer(container)) {
    const kind = container.slice(5) as ProcessKind;
    return PROCESSI[kind]
      ? processName(lang, kind)
      : translate(lang, "ui.containerProcess");
  }
  return blocksFor(container).length ? phaseName(lang, Number(container)) : translate(lang, "ui.containerPhase");
};

export const gapLabel = (lang: string, container: string, anchor: string): string => {
  const blocks = blocksFor(container);
  const finale = translate(
    lang,
    isProcessContainer(container) ? "ui.gapEndProcess" : "ui.gapEndPhase"
  );
  if (anchor === "end") return finale;

  const index = blocks.findIndex((block) => block.id === anchor);
  if (index === -1) return finale;
  const next = blocks[index + 1];
  if (!next) return finale;

  const name = (block: (typeof blocks)[number]) =>
    block.kind === "window" ? translate(lang, "ui.gapWindow") : block.id;
  return translate(lang, "ui.gapBetween", { a: name(blocks[index]), b: name(next) });
};

export const phaseHasNotes = (notes: NotesMap, index: number): boolean => {
  const prefixes = [`${index}::`];
  (PROCESSI_FASE[index] || []).forEach((kind) => prefixes.push(`proc:${kind}::`));
  return Object.keys(notes).some((key) => prefixes.some((prefix) => key.startsWith(prefix)));
};

export const phaseOfContainer = (container: string | undefined): number => {
  if (!container) return -1;
  if (isProcessContainer(container)) {
    const kind = container.slice(5);
    const found = Object.keys(PROCESSI_FASE).find((index) =>
      PROCESSI_FASE[Number(index)].includes(kind as ProcessKind)
    );
    return found === undefined ? -1 : Number(found);
  }
  return /^\d+$/.test(container) ? Number(container) : -1;
};

export const phaseHasBookmark = (bookmark: Bookmark, index: number): boolean => {
  if (!bookmark) return false;
  return phaseOfContainer(bookmark.container) === index;
};

export const isBookmarked = (bookmark: Bookmark, container: string, step: string): boolean =>
  !!bookmark && bookmark.container === container && bookmark.step === step;
