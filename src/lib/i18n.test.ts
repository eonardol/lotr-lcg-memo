import { describe, expect, it } from "vitest";
import { FASI, PROCESSI } from "./constants";
import { I18N, labelText, phaseName, processName, stepText, translate } from "./i18n";

const flatten = (value: unknown, prefix = ""): string[] => {
  if (!value || typeof value !== "object") return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    flatten(child, prefix ? `${prefix}.${key}` : key)
  );
};

describe("i18n", () => {
  it("keeps Italian and English keys aligned", () => {
    const itKeys = flatten(I18N.it).sort();
    const enKeys = flatten(I18N.en).sort();
    expect(enKeys).toEqual(itKeys);
  });

  it("contains every stable rules step in both languages", () => {
    const ids = [
      ...FASI.flatMap((phase) => phase.blocks),
      ...Object.values(PROCESSI).flatMap((process) => process.blocks),
    ]
      .filter((block) => block.kind === "step")
      .map((block) => block.id);

    ids.forEach((id) => {
      expect(typeof I18N.it.steps[id as keyof typeof I18N.it.steps]).toBe("string");
      expect(typeof I18N.en.steps[id as keyof typeof I18N.en.steps]).toBe("string");
    });
  });

  it("translates with interpolation and safe fallbacks", () => {
    expect(translate("it", "ui.phaseOf", { n: 2, total: 7 })).toBe("Fase 2 di 7");
    expect(translate("en", "ui.nextTurnHint", { n: 4 })).toBe("→ Turn 4 · Threat +1");
    expect(translate("en", "missing.key")).toBe("missing.key");
    expect(phaseName("en", 2)).toBe("Quest");
    expect(processName("it", "nemici")).toBe("Risolvere gli Attacchi dei Nemici");
    expect(stepText("en", FASI[0].blocks[0])).toBe("Resource phase begins");
  });

  it("handles old string labels and new descriptors", () => {
    expect(labelText("it", "Vecchia etichetta")).toBe("Vecchia etichetta");
    expect(labelText("it", { key: "history.turn", vars: { n: 3 } })).toBe("Turno 3");
    expect(labelText("en", { key: "history.phase", vars: { name: "Quest" } })).toBe(
      "Phase Quest"
    );
    expect(labelText("en", null)).toBe("");
  });
});
