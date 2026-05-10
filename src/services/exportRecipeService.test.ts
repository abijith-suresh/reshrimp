import { describe, expect, it } from "vitest";
import type { ProcessOptions } from "../types/processing";
import { applyRecipe, EXPORT_RECIPES, getRecipeById } from "./exportRecipeService";

describe("exportRecipeService", () => {
  describe("EXPORT_RECIPES", () => {
    it("provides at least 6 built-in recipes", () => {
      expect(EXPORT_RECIPES.length).toBeGreaterThanOrEqual(6);
    });

    it("has unique stable IDs for every recipe", () => {
      const ids = EXPORT_RECIPES.map((r) => r.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it("every recipe has a label, description, and options", () => {
      for (const recipe of EXPORT_RECIPES) {
        expect(recipe.label).toBeTruthy();
        expect(recipe.description).toBeTruthy();
        expect(recipe.options).toBeDefined();
      }
    });
  });

  describe("getRecipeById", () => {
    it("finds a recipe by its ID", () => {
      const recipe = getRecipeById("email-under-500k");
      expect(recipe).toBeDefined();
      expect(recipe!.label).toBe("Email-ready");
    });

    it("returns undefined for unknown IDs", () => {
      expect(getRecipeById("does-not-exist")).toBeUndefined();
    });
  });

  describe("applyRecipe", () => {
    it("merges recipe options on top of current settings", () => {
      const current: ProcessOptions = {
        quality: 0.5,
        resize: { width: 800, height: 600, maintainAspectRatio: false },
      };

      const result = applyRecipe(current, getRecipeById("social-post")!);

      expect(result.format).toBe("image/jpeg");
      expect(result.quality).toBe(0.85);
      // Recipe resize replaces width but inherits maintainAspectRatio from deep merge
      expect(result.resize).toEqual({
        width: 1200,
        height: 600,
        maintainAspectRatio: true,
      });
    });

    it("preserves current options not overridden by the recipe", () => {
      const current: ProcessOptions = {
        format: "image/png",
        quality: 0.9,
        removeBackground: true,
      };

      const result = applyRecipe(current, getRecipeById("thumbnail")!);

      // Recipe overrides format and quality but not removeBackground
      expect(result.format).toBe("image/jpeg");
      expect(result.quality).toBe(0.7);
      expect(result.removeBackground).toBe(true);
    });

    it("deep-merges resize options without losing existing fields", () => {
      const current: ProcessOptions = {
        resize: { width: 2000, height: 1500, maintainAspectRatio: true },
      };

      const result = applyRecipe(current, getRecipeById("web-optimized")!);

      expect(result.resize).toEqual({
        width: 1000,
        height: 1500,
        maintainAspectRatio: true,
      });
    });
  });
});
