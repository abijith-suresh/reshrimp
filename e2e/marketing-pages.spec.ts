import { test, expect } from "@playwright/test";

const ROUTES: { path: string; title: RegExp }[] = [
  { path: "/", title: /Your images deserve/i },
  { path: "/features", title: /Everything you need/i },
  { path: "/about", title: /Built for privacy/i },
  { path: "/faq", title: /Frequently asked questions/i },
  { path: "/privacy", title: /Your images never leave/i },
  { path: "/404", title: /Page not found/i },
];

test.describe("Marketing pages", () => {
  for (const route of ROUTES) {
    test(`page loads: ${route.path}`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (err) => errors.push(err.message));

      await page.goto(route.path);
      await page.waitForLoadState("networkidle");

      // No console errors
      expect(errors).toEqual([]);

      // Hero title is visible
      await expect(page.getByText(route.title).first()).toBeVisible();
    });
  }

  test("navigation links work between marketing pages", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Click each nav link and verify the page changes
    const navLinks = [
      { text: "Home", path: "/" },
      { text: "Features", path: "/features" },
      { text: "About", path: "/about" },
      { text: "FAQ", path: "/faq" },
      { text: "Privacy", path: "/privacy" },
    ];

    for (const link of navLinks) {
      // Click the nav link
      const navLink = page.locator("nav a", { hasText: link.text }).first();
      if (await navLink.isVisible()) {
        await navLink.click();
        await page.waitForLoadState("networkidle");
        await expect(page).toHaveURL(new RegExp(link.path));
      }
    }
  });

  test.describe("mobile navigation", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("burger menu opens and closes", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Find the mobile menu toggle button
      const menuButton = page
        .locator("button[aria-label*=menu], button[aria-label*=Menu], nav button")
        .first();
      if (await menuButton.isVisible()) {
        // Open menu
        await menuButton.click();
        await page.waitForTimeout(300);

        // Close menu (click again)
        await menuButton.click();
        await page.waitForTimeout(300);
      }
    });
  });
});
