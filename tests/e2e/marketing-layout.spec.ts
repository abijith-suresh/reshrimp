import { expect, test } from "./helpers";

test("keeps marketing pages readable across their responsive boundaries", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [320, 560, 680, 768, 820, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of ["/", "/privacy", "/faq"]) {
      await page.goto(route);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    }
  }
});

test("paints the footer with the page background so Safari's toolbar area matches", async ({
  page,
}) => {
  await page.goto("/");
  const backgroundOf = (selector: string) =>
    page.locator(selector).evaluate((element) => getComputedStyle(element).backgroundColor);
  expect(await backgroundOf("footer")).toBe("rgba(0, 0, 0, 0)");
  expect(await backgroundOf("body")).not.toBe("rgba(0, 0, 0, 0)");
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
  const banner = page.getByRole("banner");
  await expect(banner.getByRole("link", { name: "Open Reshrimp" })).toBeHidden();
  await menu.click();
  await expect(page.getByRole("button", { name: "Close menu", exact: true })).toBeVisible();
  await expect(banner.getByRole("link", { name: "Open Reshrimp" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu).toBeFocused();
  await page.setViewportSize({ width: 769, height: 1000 });
  await expect(menu).toBeHidden();
  await expect(banner.getByRole("link", { name: "Open Reshrimp" })).toBeVisible();
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

test("loops the hero demo on screen, pauses it off screen, and holds still for reduced motion", async ({
  page,
}) => {
  const demo = page.getByRole("img", { name: /Preview of the Reshrimp/ });
  const demoStates = () =>
    demo.evaluate((element) => [
      ...new Set(
        element
          .getAnimations({ subtree: true })
          .filter((animation) => (animation as CSSAnimation).animationName?.startsWith("hero-"))
          .map((animation) => animation.playState)
      ),
    ]);

  await page.goto("/");
  await expect.poll(demoStates).toEqual(["running"]);
  await page.getByRole("contentinfo").scrollIntoViewIfNeeded();
  await expect.poll(demoStates).toEqual(["paused"]);
  await demo.scrollIntoViewIfNeeded();
  await expect.poll(demoStates).toEqual(["running"]);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await expect.poll(demoStates).toEqual([]);
  await expect(demo).toBeVisible();
});
