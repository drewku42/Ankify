import { test, expect, type Page } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Logs in, creates a uniquely-named deck, attaches the fixture PDF,
// generates cards (mocked AI returns 3 fixed cards), and waits for the
// first card to render. Mirrors generate.spec.ts's proven flow.
async function createDeckWithCards(page: Page, deckName: string) {
  await page.goto("/login");
  await page.getByText("Dev Login").click();
  await page.getByRole("link", { name: "New Deck", exact: true }).click();
  await page.getByLabel("Deck Name").fill(deckName);
  await page.setInputFiles(
    "input[type=file]",
    path.resolve(__dirname, "../fixtures/single-page.pdf"),
  );
  await page.getByRole("button", { name: /Generate Anki Cards/ }).click();

  await page.waitForURL(/\/decks\/.+/);
  await expect(page.getByText("MOCK_CARD_1_FRONT")).toBeVisible({
    timeout: 15000,
  });
}

test("edit a card via the Dialog and see the new text in the card list", async ({
  page,
}) => {
  const deckName = `E2E Edit Deck ${Date.now()}`;
  await createDeckWithCards(page, deckName);

  // Card rows are `.group` with actions at opacity-0 until group-hover;
  // hover the first row to reveal the Edit/Delete buttons.
  const firstCardRow = page
    .locator("div.group")
    .filter({ hasText: "MOCK_CARD_1_FRONT" })
    .first();
  await firstCardRow.hover();
  await firstCardRow.getByRole("button", { name: "Edit" }).click();

  await expect(page.getByRole("heading", { name: "Edit Card" })).toBeVisible();

  const newBack = `E2E_EDITED_BACK_${Date.now()}`;
  const backTextarea = page.locator("#card-back");
  await backTextarea.fill(newBack);
  await page.getByRole("button", { name: "Save" }).click();

  // Dialog closes.
  await expect(
    page.getByRole("heading", { name: "Edit Card" }),
  ).not.toBeVisible();

  // New back text is visible in the card list.
  await expect(page.getByText(newBack)).toBeVisible();
});

test("delete a card and see the card count decrease", async ({ page }) => {
  const deckName = `E2E Delete Card Deck ${Date.now()}`;
  await createDeckWithCards(page, deckName);

  page.on("dialog", (dialog) => dialog.accept());

  await expect(page.getByText("3 cards")).toBeVisible();

  const firstCardRow = page
    .locator("div.group")
    .filter({ hasText: "MOCK_CARD_1_FRONT" })
    .first();
  await firstCardRow.hover();
  await firstCardRow.getByRole("button", { name: "Delete" }).click();

  await expect(page.getByText("2 cards")).toBeVisible();
  await expect(page.getByText("MOCK_CARD_1_FRONT")).not.toBeVisible();
});

test("delete the deck from the dashboard and see it disappear", async ({
  page,
}) => {
  const deckName = `E2E Delete Deck ${Date.now()}`;
  await createDeckWithCards(page, deckName);

  page.on("dialog", (dialog) => dialog.accept());

  await page.goto("/");

  const deckCard = page.locator(".group").filter({ hasText: deckName });
  await expect(deckCard).toBeVisible();
  await deckCard.getByRole("button", { name: "Delete" }).click();

  await expect(page.getByText(deckName)).not.toBeVisible();
});
