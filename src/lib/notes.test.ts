import { describe, expect, it } from "vitest";
import { phaseHasNotes } from "./notes";
import type { NotesMap } from "./types";

const note = (id: string, hidden = false) => ({ id, text: id, ...(hidden ? { hidden: true } : {}) });

describe("phaseHasNotes", () => {
  it("counts a visible note in the phase", () => {
    const notes: NotesMap = { "0::1.3": [note("a")] };
    expect(phaseHasNotes(notes, 0)).toBe(true);
    expect(phaseHasNotes(notes, 1)).toBe(false);
  });

  it("ignores phases whose notes are all hidden", () => {
    const notes: NotesMap = { "2::3.4": [note("a", true), note("b", true)] };
    expect(phaseHasNotes(notes, 2)).toBe(false);
  });

  it("still flags the phase when at least one note is visible", () => {
    const notes: NotesMap = { "2::3.4": [note("a", true), note("b")] };
    expect(phaseHasNotes(notes, 2)).toBe(true);
  });

  it("counts combat process notes for the combat phase", () => {
    const visible: NotesMap = { "proc:nemici::6.4.1": [note("a")] };
    const hidden: NotesMap = { "proc:giocatori::6.8.1": [note("b", true)] };
    expect(phaseHasNotes(visible, 5)).toBe(true);
    expect(phaseHasNotes(hidden, 5)).toBe(false);
  });

  it("ignores other phases and empty maps", () => {
    const notes: NotesMap = { "1::2.2": [note("a")] };
    expect(phaseHasNotes(notes, 5)).toBe(false);
    expect(phaseHasNotes({}, 0)).toBe(false);
  });
});
