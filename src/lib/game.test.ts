import { describe, expect, it } from "vitest";
import { HISTORY_LIMIT, LAST_PHASE } from "./constants";
import { initialState, makePlayer } from "./game";
import { createStore } from "./store";

const makeStore = () => {
  const game = initialState();
  game.players = [makePlayer("Aragorn", true), makePlayer("Legolas", true)];
  return createStore({
    game,
    history: [],
    notes: {},
    wake: true,
    rotation: 0,
    lang: "it",
  });
};

describe("game transitions", () => {
  it("starts a new turn from Refresh", () => {
    const store = makeStore();
    store.setGame((draft) => {
      draft.fase = LAST_PHASE;
      draft.turno = 5;
      draft.players[0].threat = 48;
      draft.quest = { willpower: 9, threat: 2, applied: false };
      draft.bookmark = { container: String(LAST_PHASE), step: "7.1" };
    });

    store.nextTurn();
    const state = store.getSnapshot();

    expect(state.game.turno).toBe(6);
    expect(state.game.fase).toBe(0);
    expect(state.game.quest).toEqual({ willpower: 0, threat: 0, applied: false });
    expect(state.game.players[0].threat).toBe(49);
    expect(state.game.players[1].threat).toBe(31);
    expect(state.game.bookmark).toEqual({
      container: String(LAST_PHASE),
      step: "7.1",
    });
    expect(state.history.at(-1)?.label).toEqual({
      key: "history.turn",
      vars: { n: 6 },
    });
  });

  it("reset keeps names, roster and notes but clears the game state", () => {
    const store = makeStore();
    store.setGame((draft) => {
      draft.turno = 8;
      draft.fase = 4;
      draft.bookmark = { container: "2", step: "2.2" };
      draft.quest = { willpower: 5, threat: 7, applied: true };
      draft.players[0].threat = 70;
      draft.players[0].setup = true;
    });
    store.updateNotes((notes) => {
      notes["0::1.1"] = [{ id: "n", text: "keep" }];
    });

    store.resetGame();
    const state = store.getSnapshot();

    expect(state.game.turno).toBe(1);
    expect(state.game.fase).toBe(0);
    expect(state.game.bookmark).toBeNull();
    expect(state.game.quest).toEqual({ willpower: 0, threat: 0, applied: false });
    expect(state.game.players.map((player) => player.name)).toEqual([
      "Aragorn",
      "Legolas",
    ]);
    expect(state.game.players.every((player) => player.threat === 30)).toBe(true);
    expect(state.game.players.every((player) => !player.setup)).toBe(true);
    expect(state.notes["0::1.1"]).toHaveLength(1);
  });

  it("undo restores the previous snapshot without touching notes", () => {
    const store = makeStore();
    store.updateNotes((notes) => {
      notes["0::1.1"] = [{ id: "n", text: "keep" }];
    });
    store.setThreat(store.getSnapshot().game.players[0].id, 60);
    const beforeUndo = store.getSnapshot();
    expect(beforeUndo.game.players[0].threat).toBe(60);

    store.undo();
    expect(store.getSnapshot().game.players[0].threat).toBe(30);
    expect(store.getSnapshot().notes["0::1.1"]).toHaveLength(1);
  });

  it("bookmark and notes never take an undo slot", () => {
    const store = makeStore();
    store.toggleBookmark("0", "1.1");
    store.updateNotes((notes) => {
      notes["0::1.2"] = [{ id: "n", text: "nota" }];
    });
    expect(store.getSnapshot().history).toHaveLength(0);
    expect(store.getSnapshot().game.bookmark).toEqual({ container: "0", step: "1.1" });
  });

  it("caps history at HISTORY_LIMIT", () => {
    const store = makeStore();
    const id = store.getSnapshot().game.players[0].id;
    for (let index = 0; index < HISTORY_LIMIT + 5; index += 1) {
      store.setThreat(id, (index % 50) + 1);
    }
    expect(store.getSnapshot().history).toHaveLength(HISTORY_LIMIT);
  });

  it("applies quest threat to every player and locks the quest", () => {
    const store = makeStore();
    store.setGame((draft) => {
      draft.quest = { willpower: 2, threat: 5, applied: false };
    });
    store.applyQuestThreat(3);
    const state = store.getSnapshot();
    expect(state.game.players.map((player) => player.threat)).toEqual([33, 33]);
    expect(state.game.quest.applied).toBe(true);
    expect(state.history.at(-1)?.label).toEqual({
      key: "history.questThreat",
      vars: { amount: 3 },
    });
  });

  it("adds and removes players only inside the official limits", () => {
    const store = makeStore();
    const added = store.addPlayer();
    expect(added).toBeTruthy();
    expect(store.getSnapshot().game.players).toHaveLength(3);
    store.addPlayer();
    expect(store.getSnapshot().game.players).toHaveLength(4);
    expect(store.addPlayer()).toBeNull();

    const last = store.getSnapshot().game.players[3];
    store.removePlayer(last.id, "Player 4");
    expect(store.getSnapshot().game.players).toHaveLength(3);
  });
});
