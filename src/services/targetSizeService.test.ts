import { describe, expect, it, vi } from "vitest";
import type { ImageFormat } from "../types/image";
import type { CanvasEncoder } from "./targetSizeService";
import { compressToTargetSize, formatSupportsQuality } from "./targetSizeService";

describe("targetSizeService", () => {
  describe("formatSupportsQuality", () => {
    it.each<{ format: ImageFormat; expected: boolean }>([
      { format: "image/jpeg", expected: true },
      { format: "image/webp", expected: true },
      { format: "image/png", expected: false },
      { format: "image/avif", expected: false },
      { format: "image/gif", expected: false },
    ])("returns $expected for $format", ({ format, expected }) => {
      expect(formatSupportsQuality(format)).toBe(expected);
    });
  });

  describe("compressToTargetSize", () => {
    const mockCanvas = {} as HTMLCanvasElement;

    it("returns the blob as-is for PNG with hitTarget based on actual size", async () => {
      const encode = vi
        .fn<CanvasEncoder>()
        .mockResolvedValue(new Blob(["x".repeat(500)], { type: "image/png" }));

      const result = await compressToTargetSize(
        { canvas: mockCanvas, format: "image/png", targetBytes: 1000 },
        encode
      );

      expect(result.hitTarget).toBe(true);
      expect(result.quality).toBe(1);
      expect(encode).toHaveBeenCalledOnce();
    });

    it("reports hitTarget=false for PNG exceeding the target", async () => {
      const encode = vi
        .fn<CanvasEncoder>()
        .mockResolvedValue(new Blob(["x".repeat(2000)], { type: "image/png" }));

      const result = await compressToTargetSize(
        { canvas: mockCanvas, format: "image/png", targetBytes: 500 },
        encode
      );

      expect(result.hitTarget).toBe(false);
    });

    it("finds a quality that fits within the target for JPEG", async () => {
      // Simulate: size scales linearly with quality
      const encode = vi.fn<CanvasEncoder>().mockImplementation((_c, _f, q = 1) => {
        const size = Math.round(2000 * q);
        return Promise.resolve(new Blob(["x".repeat(size)], { type: "image/jpeg" }));
      });

      const result = await compressToTargetSize(
        { canvas: mockCanvas, format: "image/jpeg", targetBytes: 1500 },
        encode
      );

      expect(result.hitTarget).toBe(true);
      expect(result.quality).toBeGreaterThan(0);
      expect(result.blob.size).toBeLessThanOrEqual(1500);
    });

    it("returns the floor quality blob when target is unachievable", async () => {
      // Every quality level produces a blob larger than target
      const encode = vi.fn<CanvasEncoder>().mockImplementation((_c, _f, q = 1) => {
        const size = Math.round(5000 * q + 1000); // always >= 1000
        return Promise.resolve(new Blob(["x".repeat(size)], { type: "image/jpeg" }));
      });

      const result = await compressToTargetSize(
        { canvas: mockCanvas, format: "image/jpeg", targetBytes: 500, minQuality: 0.2 },
        encode
      );

      expect(result.hitTarget).toBe(false);
      expect(result.quality).toBe(0.2);
    });

    it("respects the maxIterations limit", async () => {
      const encode = vi
        .fn<CanvasEncoder>()
        .mockResolvedValue(new Blob(["x".repeat(100)], { type: "image/webp" }));

      await compressToTargetSize(
        { canvas: mockCanvas, format: "image/webp", targetBytes: 50, maxIterations: 3 },
        encode
      );

      // Binary search: up to maxIterations + possible floor fallback
      expect(encode.mock.calls.length).toBeLessThanOrEqual(5);
    });
  });
});
