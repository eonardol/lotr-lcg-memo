import { beforeEach, describe, expect, it } from "vitest";
import {
  LEGACY_STORAGE_KEY,
  STORAGE_KEY,
  THREAT_DEFAULT,
} from "./constants";
import { loadDocument, saveDocument, sanitize, sanitizeNotes } from "./storage";

const legacyDocument = {
  state: {
    turno: 4,
    fase: 3,
    players: [
      { id: "p1", name: "Aragorn", threat: 42, setup: true },
      { id: "p2", name: "", threat: 55, setup: false },
    ],
    bookmark: { container: "1", step: "2.3" },
    quest: { willpower: 7, threat: 3, applied: false },
  },
  history: [
    { state: { turno: 3, fase: 2 }, label: "Vecchia etichetta" },
    {
      state: { turno: 3, fase: 2 },
      label: { key: "history.phase", vars: { name: "Impresa" } },
    },
  ],
  notes: {
    "0::1.3": [{ id: "n1", text: "Nota al passo" }],
    "0": [{ id: "n2", text: "Nota vecchio formato" }],
    "proc:nemici::6.4.1": [{ id: "n3", text: "Nota processo" }],
  },
  wake: false,
  rotation: 270,
  lang: "en",
};

beforeEach(() => {
  localStorage.clear();
});

describe("storage contract", () => {
  it("loads a complete document without changing its shape", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(legacyDocument));
    const loaded = loadDocument();

    expect(loaded.state.turno).toBe(4);
    expect(loaded.state.fase).toBe(3);
    expect(loaded.state.players).toEqual(legacyDocument.state.players);
    expect(loaded.state.bookmark).toEqual({ container: "1", step: "2.3" });
    expect(loaded.state.quest).toEqual({ willpower: 7, threat: 3, applied: false });
    expect(loaded.history).toHaveLength(2);
    expect(loaded.history[0].label).toBe("Vecchia etichetta");
    expect(loaded.history[1].label).toEqual({
      key: "history.phase",
      vars: { name: "Impresa" },
    });
    expect(loaded.notes["0::1.3"]).toHaveLength(1);
    expect(loaded.notes["0::end"]?.[0].text).toBe("Nota vecchio formato");
    expect(loaded.notes["proc:nemici::6.4.1"]).toHaveLength(1);
    expect(loaded.wake).toBe(false);
    expect(loaded.rotation).toBe(90);
    expect(loaded.lang).toBe("en");
    expect(loaded.hadSavedLanguage).toBe(true);
  });

  it("migrates the legacy key to the current key", () => {
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(legacyDocument));
    const loaded = loadDocument();
    expect(loaded.state.turno).toBe(4);
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}").state.turno).toBe(4);
  });

  it("migrates 1.0.0 minaccia saves", () => {
    const state = sanitize({ turno: 2, fase: 1, minaccia: 33, threatSetup: false });
    expect(state.players).toHaveLength(1);
    expect(state.players[0].threat).toBe(33);
    expect(state.players[0].setup).toBe(false);
  });

  it("uses defaults for old players without a setup flag", () => {
    const state = sanitize({
      players: [{ id: "p", name: "  Frodo  ", threat: 1200 }],
    });
    expect(state.players[0].name).toBe("Frodo");
    expect(state.players[0].threat).toBe(999);
    expect(state.players[0].setup).toBe(true);
  });

  it("drops invalid bookmarks and invalid note anchors", () => {
    const state = sanitize({ bookmark: { container: "9", step: "1.1" } });
    expect(state.bookmark).toBeNull();

    const notes = sanitizeNotes({
      "9::1.1": [{ id: "x", text: "no" }],
      "0::nope": [{ id: "y", text: "no" }],
      "0::1.3": [
        { id: "ok", text: "  keep me  " },
        { id: "empty", text: "   " },
      ],
    });
    expect(notes["9::1.1"]).toBeUndefined();
    expect(notes["0::nope"]).toBeUndefined();
    expect(notes["0::1.3"]).toEqual([{ id: "ok", text: "keep me" }]);
  });

  it("keeps the optional hidden flag on notes", () => {
    const notes = sanitizeNotes({
      "0::1.3": [
        { id: "visible", text: "Visibile" },
        { id: "hidden", text: "Nascosta", hidden: true },
        { id: "false", text: "Non nascosta", hidden: false },
      ],
    });
    expect(notes["0::1.3"]).toEqual([
      { id: "visible", text: "Visibile" },
      { id: "hidden", text: "Nascosta", hidden: true },
      { id: "false", text: "Non nascosta" },
    ]);
  });

  it("round-trips hidden notes and still loads saves without the flag", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...legacyDocument,
        notes: {
          "0::1.3": [
            { id: "old", text: "Nota vecchia" },
            { id: "new", text: "Nota nascosta", hidden: true },
          ],
        },
      })
    );
    const loaded = loadDocument();
    expect(loaded.notes["0::1.3"][0].hidden).toBeUndefined();
    expect(loaded.notes["0::1.3"][1].hidden).toBe(true);
  });

  it("normalizes rotation, clamps values and writes the exact document keys", () => {
    const state = sanitize({
      turno: 0,
      fase: 99,
      players: [{ id: "p", name: "", threat: -4, setup: true }],
      quest: { willpower: -9999, threat: 5000, applied: true },
    });
    expect(state.turno).toBe(1);
    expect(state.fase).toBe(6);
    expect(state.players[0].threat).toBe(0);
    expect(state.players[0].setup).toBe(true);
    expect(state.quest.willpower).toBe(-999);
    expect(state.quest.threat).toBe(999);
    expect(state.quest.applied).toBe(true);
  });

  it("normalizes rotation from old saves", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...legacyDocument, rotation: 180 })
    );
    expect(loadDocument().rotation).toBe(0);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...legacyDocument, rotation: 90 })
    );
    expect(loadDocument().rotation).toBe(90);
  });

  it("round-trips through saveDocument", () => {
    const document = {
      state: sanitize(legacyDocument.state),
      history: [
        {
          state: sanitize(legacyDocument.state),
          label: { key: "history.phase", vars: { name: "Quest" } },
        },
      ],
      notes: sanitizeNotes(legacyDocument.notes),
      wake: true,
      rotation: 0 as const,
      lang: "it",
    };
    saveDocument(document);
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    expect(Object.keys(raw).sort()).toEqual(
      ["history", "lang", "notes", "rotation", "state", "wake"].sort()
    );
    const loaded = loadDocument();
    expect(loaded.state.players).toHaveLength(2);
    expect(loaded.state.players[1].threat).toBe(55);
    expect(loaded.notes["0::1.3"]).toHaveLength(1);
  });

  it("returns a safe default when the save is corrupt", () => {
    localStorage.setItem(STORAGE_KEY, "{not json");
    const loaded = loadDocument();
    expect(loaded.state.turno).toBe(1);
    expect(loaded.state.fase).toBe(0);
    expect(loaded.state.players[0].threat).toBe(THREAT_DEFAULT);
    expect(loaded.state.players[0].setup).toBe(false);
    expect(loaded.hadSavedLanguage).toBe(false);
  });
});
