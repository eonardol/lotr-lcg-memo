import { expect, test } from "@playwright/test";

const playerValue = (page: import("@playwright/test").Page) =>
  page.locator(".counter-player .value-btn").first();

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("boots, updates counters and persists across reloads", async ({ page }) => {
  await expect(page.locator("#turnoValue")).toHaveText("1");
  await expect(page.locator(".phase-name")).toHaveText("Risorsa");
  await expect(page.locator(".phase-quest-btn")).toHaveCount(0);

  await page.getByRole("button", { name: "Aumenta la minaccia di Giocatore 1" }).click();
  await expect(playerValue(page)).toHaveText("31");

  await page.getByRole("button", { name: /Avanti/ }).click();
  await expect(page.locator(".phase-name")).toHaveText("Pianificazione");

  await page.reload();
  await expect(page.locator("#turnoValue")).toHaveText("1");
  await expect(playerValue(page)).toHaveText("31");
  await expect(page.locator(".phase-name")).toHaveText("Pianificazione");
});

test("loads an old save with the exact v1 storage contract", async ({ page }) => {
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem(
      "rings-turn-log/v1",
      JSON.stringify({
        state: {
          turno: 4,
          fase: 3,
          players: [
            { id: "p1", name: "Aragorn", threat: 42, setup: true },
            { id: "p2", name: "Legolas", threat: 38, setup: true },
          ],
          bookmark: { container: "1", step: "2.3" },
          quest: { willpower: 7, threat: 3, applied: false },
        },
        history: [
          {
            state: {
              turno: 3,
              fase: 2,
              players: [{ id: "p1", name: "Aragorn", threat: 41, setup: true }],
              bookmark: null,
              quest: { willpower: 0, threat: 0, applied: false },
            },
            label: { key: "history.phase", vars: { name: "Impresa" } },
          },
        ],
        notes: {
          "1::2.3": [{ id: "n1", text: "Nota persistente" }],
        },
        wake: false,
        rotation: 0,
        lang: "en",
      })
    );
  });
  await page.reload();

  await expect(page.locator("#turnoValue")).toHaveText("4");
  await expect(page.locator(".phase-name")).toHaveText("Travel");
  await expect(page.locator(".counter-player .value-btn").first()).toHaveText("42");
  await expect(page.locator(".counter-player .player-name").first()).toContainText("Aragorn");
  await expect(page.locator(".step-pill.has-bookmark")).toHaveCount(1);
  await expect(page.getByRole("button", { name: /Phase Impresa/ })).toBeVisible();
  await page.getByRole("button", { name: "Phase 2: Planning" }).click();
  await expect(page.locator(".step-block.bookmarked")).toHaveCount(1);
  await expect(page.locator(".player-note").first()).toHaveText("Nota persistente");
});

test("tablet mode adds, renames and removes players", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "tablet", "tablet-only flow");
  await expect(page.getByRole("button", { name: "Aggiungi un giocatore" })).toBeVisible();
  await page.getByRole("button", { name: "Aggiungi un giocatore" }).click();
  await expect(page.locator(".counter-player")).toHaveCount(2);

  await page.locator(".counter-player .player-name").nth(1).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("textbox").fill("Sam");
  await dialog.getByRole("button", { name: "Salva" }).click();
  await expect(page.locator(".counter-player .player-name").nth(1)).toHaveText("Sam");

  await page.locator(".counter-player .player-remove").nth(1).click();
  await expect(page.locator(".counter-player")).toHaveCount(1);
});

test("quest resolution raises every player's threat and undo restores it", async ({ page }) => {
  await page.getByRole("button", { name: "Fase 3: Impresa" }).click();
  await page.getByRole("button", { name: "Apri la risoluzione dell'impresa" }).click();

  const dialog = page.getByRole("dialog");
  await dialog.getByRole("textbox", { name: "Forza di Volontà" }).fill("5");
  await dialog.getByRole("textbox", { name: "Forza di Minaccia" }).fill("8");
  await expect(dialog.getByRole("button", { name: "Aumenta la minaccia di 3" })).toBeVisible();
  await dialog.getByRole("button", { name: "Aumenta la minaccia di 3" }).click();

  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".counter-player .value-btn")).toHaveText("33");

  await page.getByRole("button", { name: /Annulla/ }).click();
  await expect(page.locator(".counter-player .value-btn")).toHaveText("30");
});

test("quest progress shows a positive result", async ({ page }) => {
  await page.getByRole("button", { name: "Fase 3: Impresa" }).click();
  await page.locator(".phase-quest-btn").click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("textbox", { name: "Forza di Volontà" }).fill("9");
  await dialog.getByRole("textbox", { name: "Forza di Minaccia" }).fill("4");
  await expect(dialog.locator(".quest-progress-value")).toHaveText("5");
  await dialog.getByRole("button", { name: "Chiudi", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("notes and bookmark survive closing the dialog", async ({ page }) => {
  await page.locator(".gap-add").first().click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("textbox", { name: "Nuova nota" }).fill("Promemoria di prova");
  await dialog.getByRole("button", { name: "Aggiungi" }).click();
  await expect(dialog.locator(".note-text")).toHaveText("Promemoria di prova");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".player-note").first()).toHaveText("Promemoria di prova");

  await page.locator(".step-block").first().click();
  await expect(page.locator(".step-block.bookmarked")).toHaveCount(1);
  await expect(page.locator(".step-pill.has-bookmark")).toHaveCount(1);

  await page.reload();
  await expect(page.locator(".player-note").first()).toHaveText("Promemoria di prova");
  await expect(page.locator(".step-block.bookmarked")).toHaveCount(1);
});

test("new game keeps names and notes, resets the game", async ({ page }) => {
  await page.locator(".gap-add").first().click();
  const notes = page.getByRole("dialog");
  await notes.getByRole("textbox", { name: "Nuova nota" }).fill("Resta");
  await notes.getByRole("button", { name: "Aggiungi" }).click();
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "Aumenta la minaccia di Giocatore 1" }).click();
  await page.getByRole("button", { name: /Avanti/ }).click();
  await page.getByRole("button", { name: "Nuova partita" }).click();
  const reset = page.getByRole("dialog");
  await reset.getByRole("button", { name: "Azzera" }).click();

  await expect(page.locator("#turnoValue")).toHaveText("1");
  await expect(page.locator(".phase-name")).toHaveText("Risorsa");
  await expect(page.locator(".counter-player .value-btn")).toHaveText("30");
  await expect(page.locator(".player-note").first()).toHaveText("Resta");
});

test("language and rotation toggles persist", async ({ page }, testInfo) => {
  await page.getByRole("button", { name: /Lingua: italiano/ }).click();
  await expect(page.locator(".phase-name")).toHaveText("Resource");
  await expect(page.getByRole("button", { name: /Next/ })).toBeVisible();

  if (testInfo.project.name !== "tablet") {
    await page.getByRole("button", { name: /Rotate the interface to landscape/ }).click();
    await expect(page.locator("#rotator")).toHaveAttribute("data-rotation", "90");
  }

  await page.reload();
  await expect(page.locator(".phase-name")).toHaveText("Resource");
  if (testInfo.project.name !== "tablet") {
    await expect(page.locator("#rotator")).toHaveAttribute("data-rotation", "90");
  }
});

test("notes opened from a process close back to the process only", async ({ page }) => {
  await page.getByRole("button", { name: /Fase 6/ }).click();
  await page.locator(".process-btn").first().click();
  await expect(page.locator(".panel-process")).toBeVisible();

  await page.locator(".panel-process .gap-add").first().click();
  const notes = page.locator(".panel-notes");
  await expect(notes).toBeVisible();
  await notes.getByRole("textbox", { name: "Nuova nota" }).fill("Nota dal processo");
  await notes.getByRole("button", { name: "Aggiungi" }).click();
  await expect(notes.locator(".note-text")).toHaveText("Nota dal processo");

  await page.keyboard.press("Escape");
  await expect(notes).toHaveCount(0);
  await expect(page.locator(".panel-process")).toBeVisible();
  await expect(page.locator(".panel-process .player-note")).toHaveText("Nota dal processo");

  await page.keyboard.press("Escape");
  await expect(page.locator(".panel-process")).toHaveCount(0);
});

test("dialogs stay usable with the interface rotated", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "tablet", "rotation is phone-only");
  await page.getByRole("button", { name: /Ruota/ }).click();
  await expect(page.locator("#rotator")).toHaveAttribute("data-rotation", "90");

  await page.locator(".gap-add").first().click();
  const notes = page.locator(".panel-notes");
  await expect(notes).toBeVisible();
  const box = await notes.boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  expect(viewport).not.toBeNull();
  if (box && viewport) {
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 24);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 24);
  }
  await page.keyboard.press("Escape");
  await expect(notes).toHaveCount(0);
});
