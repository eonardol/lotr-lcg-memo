import { expect, test } from "@playwright/test";

test("loads the app offline after the service worker is installed", async ({
  context,
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect(page.locator("#turnoValue")).toHaveText("1");

  await page.getByRole("button", { name: "Aumenta la minaccia di Giocatore 1" }).click();
  await expect(page.locator(".counter-player .value-btn")).toHaveText("31");

  await page.evaluate(() => navigator.serviceWorker.ready);
  await context.setOffline(true);
  await page.reload();

  await expect(page.locator("#turnoValue")).toHaveText("1");
  await expect(page.locator(".phase-name")).toHaveText("Risorsa");
  await expect(page.locator(".counter-player .value-btn")).toHaveText("31");

  await context.setOffline(false);
});
