import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ACCEPTED_INPUT_FORMATS,
  CONVERTIBLE_OUTPUT_FORMATS,
  isAcceptedInputFormat,
  isConvertibleOutputFormat,
  isHeicInput,
} from "../config/imageFormats";

async function importFormatDetectionService() {
  vi.resetModules();
  return import("./formatDetectionService");
}

describe("formatDetectionService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    delete window.heic2any;
    document.head.querySelectorAll("script[data-heic2any-loader]").forEach((node) => node.remove());
  });

  describe("isAcceptedInputFormat", () => {
    it.each<{ mime: string; expected: boolean }>([
      { mime: "image/jpeg", expected: true },
      { mime: "image/png", expected: true },
      { mime: "image/webp", expected: true },
      { mime: "image/gif", expected: false },
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
    it.each([
      ["image/jpeg", true],
      ["image/png", true],
      ["image/webp", true],
      ["image/avif", true],
      ["image/heic", false],
    ])("returns %s => %s", (format, expected) => {
      expect(
        isConvertibleOutputFormat(format as Parameters<typeof isConvertibleOutputFormat>[0])
      ).toBe(expected);
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
    it("converts a HEIC blob to PNG using the browser-loaded decoder", async () => {
      const { decodeHeicBlob } = await importFormatDetectionService();
      const convertedBlob = new Blob(["converted-png"], { type: "image/png" });
      const heicBlob = new Blob(["fake-heic"], { type: "image/heic" });
      window.heic2any = vi.fn().mockResolvedValue(convertedBlob);

      const result = await decodeHeicBlob(heicBlob);

      expect(window.heic2any).toHaveBeenCalledWith({ blob: heicBlob, toType: "image/png" });
      expect(result.type).toBe("image/png");
    });

    it("loads the decoder script when the browser global is missing", async () => {
      const { decodeHeicBlob } = await importFormatDetectionService();
      const convertedBlob = new Blob(["converted-png"], { type: "image/png" });
      const heicBlob = new Blob(["fake-heic"], { type: "image/heic" });

      const decodePromise = decodeHeicBlob(heicBlob);
      const loaderScript = document.head.querySelector(
        "script[data-heic2any-loader='true']"
      ) as HTMLScriptElement;

      expect(loaderScript).toBeInTheDocument();

      window.heic2any = vi.fn().mockResolvedValue(convertedBlob);
      loaderScript.onload?.(new Event("load"));

      await expect(decodePromise).resolves.toBe(convertedBlob);
      expect(window.heic2any).toHaveBeenCalledWith({ blob: heicBlob, toType: "image/png" });
    });

    it("rejects when the decoder script fails to load", async () => {
      const { decodeHeicBlob } = await importFormatDetectionService();
      const heicBlob = new Blob(["fake-heic"], { type: "image/heic" });

      const decodePromise = decodeHeicBlob(heicBlob);
      const loaderScript = document.head.querySelector(
        "script[data-heic2any-loader='true']"
      ) as HTMLScriptElement;

      loaderScript.onerror?.(new Event("error"));

      await expect(decodePromise).rejects.toThrow("Failed to load the HEIC decoder");
      expect(document.head.querySelector("script[data-heic2any-loader='true']")).toBeNull();
    });

    it("rejects when the loaded script does not expose the decoder", async () => {
      const { decodeHeicBlob } = await importFormatDetectionService();
      const heicBlob = new Blob(["fake-heic"], { type: "image/heic" });

      const decodePromise = decodeHeicBlob(heicBlob);
      const loaderScript = document.head.querySelector(
        "script[data-heic2any-loader='true']"
      ) as HTMLScriptElement;

      loaderScript.onload?.(new Event("load"));

      await expect(decodePromise).rejects.toThrow(
        "heic2any loaded without exposing a browser decoder"
      );
      expect(document.head.querySelector("script[data-heic2any-loader='true']")).toBeNull();
    });
  });

  describe("ACCEPTED_INPUT_FORMATS", () => {
    it("includes HEIC and AVIF alongside the core browser formats", () => {
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
