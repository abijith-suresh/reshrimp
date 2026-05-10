import { test, expect } from "@playwright/test";

const ROUTES = [
  { path: "/", title: /Your images deserve/i },
  { path: "/features", title: /Everything you need/i },
  { path: "/about", title: /Built for privacy/i },
  { path: "/faq", title: /Frequently asked questions/i },
  { path: "/privacy", title: /Your images never leave/i },
  { path: "/changelog", title: /What.s new in Reshrimp/i },
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
});
