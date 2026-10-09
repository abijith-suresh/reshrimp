import { expect, test } from "./helpers";

test("keeps marketing pages readable across their responsive boundaries", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [320, 560, 680, 768, 820, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of ["/", "/about", "/privacy", "/faq"]) {
      await page.goto(route);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    }
  }
});

test("preserves the inclusive hero and navigation breakpoints", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 820, height: 1000 });
  await page.goto("/");
  const title = page.getByRole("heading", { level: 1 });
  const preview = page.getByRole("img", { name: /Preview of the Reshrimp/ });
  const titleBox = await title.boundingBox();
  const previewBox = await preview.boundingBox();
  expect(titleBox).not.toBeNull();
  expect(previewBox).not.toBeNull();
  if (!titleBox || !previewBox) throw new Error("Hero title and preview must have layout boxes");
  expect(previewBox.y).toBeGreaterThan(titleBox.y + titleBox.height);

  await page.setViewportSize({ width: 768, height: 1000 });
  const menu = page.getByRole("button", { name: "Open menu", exact: true });
  await expect(menu).toBeVisible();
  await menu.click();
  await expect(page.getByRole("button", { name: "Close menu", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu).toBeFocused();
  await page.setViewportSize({ width: 769, height: 1000 });
  await expect(menu).toBeHidden();
  await expect(page.getByRole("banner").getByRole("link", { name: "Use Reshrimp" })).toBeVisible();
});

test("opens FAQ answers with the keyboard and respects live reduced motion", async ({ page }) => {
  await page.goto("/faq");
  const question = page.getByRole("button", { name: "Is Reshrimp free?", exact: true });
  const answer = page.getByRole("region", { name: "Is Reshrimp free?", exact: true });
  await expect(answer).toHaveCount(0);
  await question.focus();
  await page.keyboard.press("Enter");
  await expect(question).toHaveAttribute("aria-expanded", "true");
  await expect(answer).toBeVisible();
  await expect(answer.getByText(/Yes/)).toHaveCSS("opacity", "1");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.keyboard.press("Enter");
  await expect(question).toHaveAttribute("aria-expanded", "false");
  await expect(answer).toHaveCount(0);
  await page.keyboard.press("Enter");
  await expect(answer.getByText(/Yes/)).toHaveCSS("opacity", "1");
  expect(
    await answer.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).transitionDuration)
    )
  ).toBeLessThanOrEqual(0.00001);
});
