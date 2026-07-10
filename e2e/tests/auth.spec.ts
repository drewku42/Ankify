import { test, expect } from "@playwright/test";

test("dev-login lands on the decks dashboard", async ({ page }) => {
  await page.goto("/login");
  await page.getByText("Dev Login").click();
  await expect(page.getByText("Your Decks")).toBeVisible();
});
