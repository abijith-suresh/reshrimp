import { describe, expect, it } from "vitest";
import type { ImageAdjustments } from "../types/processing";
import { buildFilterString, DEFAULT_ADJUSTMENTS, isNoOpAdjustments } from "./adjustmentService";

describe("adjustmentService", () => {
  describe("DEFAULT_ADJUSTMENTS", () => {
    it("has all values set to 1 (no-op)", () => {
      expect(DEFAULT_ADJUSTMENTS).toEqual({
        brightness: 1,
        contrast: 1,
        saturation: 1,
      });
    });
  });

  describe("isNoOpAdjustments", () => {
    it.each<{ adj: ImageAdjustments | undefined; expected: boolean }>([
      { adj: undefined, expected: true },
      { adj: {}, expected: true },
      { adj: { brightness: 1, contrast: 1, saturation: 1 }, expected: true },
      { adj: { brightness: 1 }, expected: true },
      { adj: { brightness: 1.5 }, expected: false },
      { adj: { contrast: 0.8 }, expected: false },
      { adj: { saturation: 2 }, expected: false },
      { adj: { brightness: 1, contrast: 1, saturation: 1.5 }, expected: false },
    ])("returns $expected for $adj", ({ adj, expected }) => {
      expect(isNoOpAdjustments(adj)).toBe(expected);
    });
  });

  describe("buildFilterString", () => {
    it("returns empty string for no-op adjustments", () => {
      expect(buildFilterString({})).toBe("");
      expect(buildFilterString({ brightness: 1, contrast: 1, saturation: 1 })).toBe("");
    });

    it("builds a brightness-only filter", () => {
      expect(buildFilterString({ brightness: 1.5 })).toBe("brightness(1.5)");
    });

    it("builds a contrast-only filter", () => {
      expect(buildFilterString({ contrast: 0.7 })).toBe("contrast(0.7)");
    });

    it("builds a saturation-only filter", () => {
      expect(buildFilterString({ saturation: 2 })).toBe("saturate(2)");
    });

    it("combines multiple adjustments in order", () => {
      const result = buildFilterString({ brightness: 1.2, contrast: 0.8, saturation: 1.5 });

      expect(result).toBe("brightness(1.2) contrast(0.8) saturate(1.5)");
    });

    it("omits neutral values from the combined filter", () => {
      const result = buildFilterString({ brightness: 1, contrast: 1.5, saturation: 1 });

      expect(result).toBe("contrast(1.5)");
    });
  });
});
