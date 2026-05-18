import { describe, expect, it } from "vitest";
import { mapAvifQuality } from "./avifEncoderService";

describe("mapAvifQuality", () => {
  it("maps 1-100 quality to avif quantization range", () => {
    expect(mapAvifQuality(100)).toBeLessThanOrEqual(20);
    expect(mapAvifQuality(1)).toBeGreaterThanOrEqual(60);
  });

  it("returns higher values for lower quality input", () => {
    const high = mapAvifQuality(90);
    const low = mapAvifQuality(10);
    expect(high).toBeLessThan(low);
  });

  it("clamps to valid range", () => {
    expect(mapAvifQuality(200)).toBeGreaterThan(0);
    expect(mapAvifQuality(0)).toBeGreaterThan(0);
    expect(mapAvifQuality(-1)).toBeGreaterThan(0);
  });
});
