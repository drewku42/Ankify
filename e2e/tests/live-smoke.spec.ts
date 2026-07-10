import { test, expect } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test.skip(
  process.env.LIVE_SMOKE !== "1",
  "live-smoke only runs with LIVE_SMOKE=1",
);

test("upload a PDF and generate cards (real OpenAI), then export", async ({
  page,
}) => {
  // Unique per run: the DB persists across runs and rejects duplicate deck
  // names (ANKIFY-002), so a fixed name would fail on the second run.
  const deckName = `Live Smoke ${Date.now()}`;

  await page.goto("/login");
  await page.getByText("Dev Login").click();
  await page.getByRole("link", { name: "New Deck", exact: true }).click();
  await page.getByLabel("Deck Name").fill(deckName);
  await page.setInputFiles(
    "input[type=file]",
    path.resolve(__dirname, "../fixtures/single-page.pdf"),
  );
  await page.getByRole("button", { name: /Generate Anki Cards/ }).click();

  // App navigates to the new deck page and auto-triggers generation there.
  await page.waitForURL(/\/decks\/.+/);

  // Real generation is slow — give it up to two minutes. Assert at least one
  // card came back; do NOT assert specific text, it's real AI output.
  await expect(page.getByText(/^[1-9]\d* cards?$/)).toBeVisible({
    timeout: 120_000,
  });

  // Generation must not have landed in the error state.
  await expect(page.getByText("Card generation failed.")).not.toBeVisible();

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: /Export \.apkg/ }).click(),
  ]);
  const downloadPath = await download.path();
  expect(downloadPath).toBeTruthy();
  const fs = await import("fs");
  const stats = fs.statSync(downloadPath!);
  expect(stats.size).toBeGreaterThan(0);
});
