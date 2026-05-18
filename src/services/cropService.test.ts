import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { validateCropRegion, cropOnCanvas } from "./cropService";
import type { CropRegion } from "@/types/processing";
import { setupBrowserMocks, restoreMocks } from "../test/mocks";

describe("validateCropRegion", () => {
  const imageW = 1200;
  const imageH = 800;

  it("returns null for a valid crop region", () => {
    const region: CropRegion = { x: 100, y: 50, width: 500, height: 300 };
    expect(validateCropRegion(region, imageW, imageH)).toBeNull();
  });

  it("rejects negative x", () => {
    const region: CropRegion = { x: -1, y: 0, width: 100, height: 100 };
    expect(validateCropRegion(region, imageW, imageH)).toMatch(/x must be/);
  });

  it("rejects negative y", () => {
    const region: CropRegion = { x: 0, y: -1, width: 100, height: 100 };
    expect(validateCropRegion(region, imageW, imageH)).toMatch(/y must be/);
  });

  it("rejects x + width exceeding image width", () => {
    const region: CropRegion = { x: 1000, y: 0, width: 300, height: 100 };
    expect(validateCropRegion(region, imageW, imageH)).toMatch(/width|exceeds/);
  });

  it("rejects y + height exceeding image height", () => {
    const region: CropRegion = { x: 0, y: 700, width: 100, height: 200 };
    expect(validateCropRegion(region, imageW, imageH)).toMatch(/height|exceeds/);
  });

  it("rejects zero width", () => {
    const region: CropRegion = { x: 0, y: 0, width: 0, height: 100 };
    expect(validateCropRegion(region, imageW, imageH)).toMatch(/width must be/);
  });

  it("rejects zero height", () => {
    const region: CropRegion = { x: 0, y: 0, width: 100, height: 0 };
    expect(validateCropRegion(region, imageW, imageH)).toMatch(/height must be/);
  });
});

describe("cropOnCanvas", () => {
  beforeEach(() => {
    setupBrowserMocks();
  });

  afterEach(() => {
    restoreMocks();
  });

  it("returns a canvas with cropped dimensions", async () => {
    const img = new Image();
    Object.defineProperty(img, "width", { value: 800 });
    Object.defineProperty(img, "height", { value: 600 });

    const region: CropRegion = { x: 100, y: 50, width: 200, height: 150 };
    const canvas = cropOnCanvas(img, region);

    expect(canvas.width).toBe(200);
    expect(canvas.height).toBe(150);
  });
});
