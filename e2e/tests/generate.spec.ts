import { test, expect } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test("upload a PDF and generate cards (mocked AI), then export", async ({
  page,
}) => {
  // Unique per run: the DB persists across runs and rejects duplicate deck
  // names (ANKIFY-002), so a fixed name would fail on the second run.
  const deckName = `E2E Deck ${Date.now()}`;

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

  // Mock AI returns 3 fixed cards; assert on fixture content.
  await expect(page.getByText("MOCK_CARD_1_FRONT")).toBeVisible({
    timeout: 15000,
  });

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

test("the generate button stays disabled until both a name and a file are provided", async ({
  page,
}) => {
  // The real, observable form validation is the submit button's disabled
  // state: `disabled={isCreating || !name.trim() || !file}` in UploadPage.
  // (Attaching a non-PDF via the file input is NOT a meaningful negative
  // test — only the drag-drop handler type-checks, so setInputFiles with a
  // .txt would fire nothing; and handleSubmit's toasts are unreachable via
  // the button because it disables first.) So we assert the guard that
  // actually governs this path.
  await page.goto("/login");
  await page.getByText("Dev Login").click();
  await page.getByRole("link", { name: "New Deck", exact: true }).click();

  const generate = page.getByRole("button", { name: /Generate Anki Cards/ });

  // No name, no file → disabled.
  await expect(generate).toBeDisabled();

  // Attach a file; the name auto-fills from the filename → now enabled.
  await page.setInputFiles(
    "input[type=file]",
    path.resolve(__dirname, "../fixtures/single-page.pdf"),
  );
  await expect(generate).toBeEnabled();

  // Clear the name while the file remains → disabled again.
  await page.getByLabel("Deck Name").fill("");
  await expect(generate).toBeDisabled();

  // No navigation happened; still on the upload page.
  await expect(page).toHaveURL(/\/upload$/);
});
