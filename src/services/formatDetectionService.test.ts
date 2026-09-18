import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
    document.head.querySelectorAll("script[data-heic2any-loader]").forEach((node) => {
      node.remove();
    });
  });

  describe("isHeicBlob", () => {
    function makeFtypBlob(brand: string): Blob {
      const bytes = new Uint8Array(12);
      for (let i = 0; i < 4; i += 1) {
        bytes[4 + i] = "ftyp".charCodeAt(i);
        bytes[8 + i] = brand.charCodeAt(i);
      }
      return new Blob([bytes]);
    }

    it.each(["heic", "heix", "mif1", "msf1", "hevc"])(
      "detects the %s ftyp brand as HEIC content",
      async (brand) => {
        const { isHeicBlob } = await importFormatDetectionService();
        await expect(isHeicBlob(makeFtypBlob(brand))).resolves.toBe(true);
      }
    );

    it.each(["avif", "mp42", "isom", "qt  "])(
      "does not treat the %s ftyp brand as HEIC content",
      async (brand) => {
        const { isHeicBlob } = await importFormatDetectionService();
        await expect(isHeicBlob(makeFtypBlob(brand))).resolves.toBe(false);
      }
    );

    it("rejects a blob without an ftyp box", async () => {
      const { isHeicBlob } = await importFormatDetectionService();
      const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 1, 2, 3, 4]);

      await expect(isHeicBlob(new Blob([jpegBytes]))).resolves.toBe(false);
    });

    it("rejects a blob too small to contain an ftyp box", async () => {
      const { isHeicBlob } = await importFormatDetectionService();

      await expect(isHeicBlob(new Blob([new Uint8Array(8)]))).resolves.toBe(false);
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

    it("rejects when the decoder returns no output images", async () => {
      const { decodeHeicBlob } = await importFormatDetectionService();
      const heicBlob = new Blob(["fake-heic"], { type: "image/heic" });
      window.heic2any = vi.fn().mockResolvedValue([]);

      await expect(decodeHeicBlob(heicBlob)).rejects.toThrow(
        "HEIC decoding produced no output image"
      );
    });
  });
});
