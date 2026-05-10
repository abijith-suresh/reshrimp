import { beforeEach, describe, expect, it, vi, afterEach } from "vitest";
import type { ImageFormat } from "../types/image";

// Mock heic2any since it requires Web Workers unavailable in jsdom
vi.mock("heic2any", () => ({
  default: vi.fn().mockResolvedValue(new Blob(["converted-png"], { type: "image/png" })),
}));

import {
  ACCEPTED_INPUT_FORMATS,
  CONVERTIBLE_OUTPUT_FORMATS,
  detectAvifSupport,
  isAcceptedInputFormat,
  isConvertibleOutputFormat,
  isHeicInput,
  decodeHeicBlob,
} from "./formatDetectionService";

describe("formatDetectionService", () => {
  describe("isAcceptedInputFormat", () => {
    it.each<{ mime: string; expected: boolean }>([
      { mime: "image/jpeg", expected: true },
      { mime: "image/png", expected: true },
      { mime: "image/webp", expected: true },
      { mime: "image/gif", expected: true },
      { mime: "image/avif", expected: true },
      { mime: "image/heic", expected: true },
      { mime: "image/heif", expected: true },
      { mime: "image/svg+xml", expected: false },
      { mime: "image/tiff", expected: false },
    ])("returns $expected for $mime", ({ mime, expected }) => {
      expect(isAcceptedInputFormat(mime)).toBe(expected);
    });
  });

  describe("isConvertibleOutputFormat", () => {
    it.each<{ format: ImageFormat; expected: boolean }>([
      { format: "image/jpeg", expected: true },
      { format: "image/png", expected: true },
      { format: "image/webp", expected: true },
      { format: "image/avif", expected: true },
      { format: "image/gif", expected: false },
    ])("returns $expected for $format", ({ format, expected }) => {
      expect(isConvertibleOutputFormat(format)).toBe(expected);
    });
  });

  describe("detectAvifSupport", () => {
    let origToBlob: typeof HTMLCanvasElement.prototype.toBlob;

    beforeEach(() => {
      origToBlob = HTMLCanvasElement.prototype.toBlob;
    });

    afterEach(() => {
      HTMLCanvasElement.prototype.toBlob = origToBlob;
    });

    it("returns true when the browser can encode AVIF", async () => {
      HTMLCanvasElement.prototype.toBlob = vi.fn((callback, type) => {
        if (type === "image/avif") {
          callback!(new Blob([], { type: "image/avif" }));
        }
        return undefined as unknown as void;
      });

      await expect(detectAvifSupport()).resolves.toBe(true);
    });

    it("returns false when the browser cannot encode AVIF", async () => {
      HTMLCanvasElement.prototype.toBlob = vi.fn((callback, type) => {
        if (type === "image/avif") {
          callback!(null as unknown as Blob);
        }
        return undefined as unknown as void;
      });

      await expect(detectAvifSupport()).resolves.toBe(false);
    });
  });

  describe("isHeicInput", () => {
    it.each<{ mime: string; expected: boolean }>([
      { mime: "image/heic", expected: true },
      { mime: "image/heif", expected: true },
      { mime: "image/jpeg", expected: false },
      { mime: "image/png", expected: false },
    ])("returns $expected for $mime", ({ mime, expected }) => {
      expect(isHeicInput(mime)).toBe(expected);
    });
  });

  describe("decodeHeicBlob", () => {
    it("converts a HEIC blob to PNG using heic2any", async () => {
      const heicBlob = new Blob(["fake-heic"], { type: "image/heic" });
      const result = await decodeHeicBlob(heicBlob);

      expect(result.type).toBe("image/png");
    });
  });

  describe("ACCEPTED_INPUT_FORMATS", () => {
    it("includes HEIC and AVIF alongside the legacy formats", () => {
      const mimes = ACCEPTED_INPUT_FORMATS as string[];

      expect(mimes).toContain("image/heic");
      expect(mimes).toContain("image/heif");
      expect(mimes).toContain("image/avif");
      expect(mimes).toContain("image/jpeg");
    });
  });

  describe("CONVERTIBLE_OUTPUT_FORMATS", () => {
    it("includes AVIF in the output set", () => {
      expect(CONVERTIBLE_OUTPUT_FORMATS).toContain("image/avif");
    });
  });
});
