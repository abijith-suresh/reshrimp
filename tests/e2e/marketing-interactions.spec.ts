import { expect, test } from "./helpers";

test("opens the mobile menu, navigates, and restores focus when dismissed", async ({ page }) => {
  await page.goto("/");
  const openMenu = page.getByRole("button", { name: "Open menu", exact: true });
  await expect(openMenu).toBeVisible();
  await openMenu.tap();

  const closeMenu = page.getByRole("button", { name: "Close menu", exact: true });
  await expect(closeMenu).toHaveAttribute("aria-expanded", "true");
  await page.getByRole("banner").getByRole("link", { name: "About", exact: true }).tap();
  await expect(page).toHaveURL(/\/about\/?$/);
  await expect(openMenu).toHaveAttribute("aria-expanded", "false");

  await openMenu.tap();
  await expect(closeMenu).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(openMenu).toBeFocused();
  await expect(openMenu).toHaveAttribute("aria-expanded", "false");
  await expect(closeMenu).toHaveCount(0);
});
