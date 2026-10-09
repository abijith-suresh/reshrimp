import { describe, expect, it } from "vitest";
import { MAX_PIXEL_DIMENSION, MAX_TOTAL_PIXELS } from "../config/constants";
import type { ImageFormat } from "../types/image";
import {
  generateDownloadFilename,
  getFileExtension,
  validateImageDimensions,
  validateImageFile,
} from "./validationService";

// Set the file size without a large memory allocation.
function makeFile(name: string, type: string, sizeBytes: number): File {
  const file = new File([], name, { type });
  Object.defineProperty(file, "size", { value: sizeBytes, writable: false });
  return file;
}

function makeFtypFile(brand: string, name = "photo.heic", type = ""): File {
  const bytes = new Uint8Array(12);
  for (let i = 0; i < 4; i += 1) {
    bytes[4 + i] = "ftyp".charCodeAt(i);
    bytes[8 + i] = brand.charCodeAt(i);
  }
  return new File([bytes], name, { type });
}

const MB = 1024 * 1024;

describe("validateImageFile", () => {
  it("returns error when file is null/falsy", async () => {
    // @ts-expect-error Test input from outside TypeScript.
    const result = await validateImageFile(null);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("returns error for non-image file type", async () => {
    const file = makeFile("doc.pdf", "application/pdf", 1000);
    const result = await validateImageFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/image/i);
  });

  it("returns error for unsupported image format and includes format name in message", async () => {
    const file = makeFile("image.bmp", "image/bmp", 1000);
    const result = await validateImageFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("image/bmp");
  });

  it.each([
    { bytes: 10 * MB - 1, status: "accepted" },
    { bytes: 10 * MB, status: "accepted" },
    { bytes: 10 * MB + 1, status: "warning" },
    { bytes: 50 * MB, status: "warning" },
    { bytes: 50 * MB + 1, status: "rejected" },
  ])("reports $status for a file of $bytes bytes", async ({ bytes, status }) => {
    const result = await validateImageFile(makeFile("photo.png", "image/png", bytes));
    if (status === "rejected") {
      expect(result).toEqual({
        valid: false,
        error: expect.stringContaining("exceeds maximum limit"),
      });
    } else if (status === "warning") {
      expect(result).toEqual({
        valid: true,
        warning: expect.stringContaining("Large file detected"),
      });
    } else {
      expect(result).toEqual({ valid: true });
    }
  });
});

describe("validateImageFile (HEIC without a usable MIME type)", () => {
  it("accepts a .heic file with an empty MIME type when magic bytes confirm HEIC", async () => {
    const file = makeFtypFile("heic");
    const result = await validateImageFile(file);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("accepts HEIC content by magic bytes regardless of file extension", async () => {
    const file = makeFtypFile("mif1", "photo.bin");
    const result = await validateImageFile(file);
    expect(result.valid).toBe(true);
  });

  it("rejects an empty-MIME file whose magic bytes are not HEIC", async () => {
    const file = makeFtypFile("avif", "mystery.bin");
    const result = await validateImageFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/image/i);
  });

  it("rejects an empty-MIME file too small to contain an ftyp box", async () => {
    const file = new File([new Uint8Array(4)], "tiny.heic", { type: "" });
    const result = await validateImageFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/image/i);
  });
});

describe("validateImageDimensions", () => {
  it("accepts dimensions at the maximum pixel limit", () => {
    const result = validateImageDimensions({
      width: MAX_PIXEL_DIMENSION,
      height: 1,
    });
    expect(result.valid).toBe(true);
  });

  it("rejects width beyond the maximum pixel limit", () => {
    const result = validateImageDimensions({
      width: MAX_PIXEL_DIMENSION + 1,
      height: 100,
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain(String(MAX_PIXEL_DIMENSION));
  });

  it("rejects height beyond the maximum pixel limit", () => {
    const result = validateImageDimensions({
      width: 100,
      height: MAX_PIXEL_DIMENSION + 1,
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain(String(MAX_PIXEL_DIMENSION));
  });

  it("rejects dimensions over the total pixel budget", () => {
    const result = validateImageDimensions({ width: 8000, height: 4001 });

    expect(result.valid).toBe(false);
    expect(result.error).toContain(String(MAX_TOTAL_PIXELS.toLocaleString()));
  });
});

describe("getFileExtension", () => {
  const cases: Array<[ImageFormat, string]> = [
    ["image/jpeg", "jpg"],
    ["image/png", "png"],
    ["image/webp", "webp"],
  ];

  it.each(cases)("maps %s to .%s", (format, ext) => {
    expect(getFileExtension(format)).toBe(ext);
  });
});

describe("generateDownloadFilename", () => {
  it("strips original extension and appends -processed.{ext}", () => {
    expect(generateDownloadFilename("photo.jpg", "image/png")).toBe("photo-processed.png");
  });

  it("handles files with multiple dots correctly", () => {
    expect(generateDownloadFilename("foo.bar.png", "image/jpeg")).toBe("foo.bar-processed.jpg");
  });

  it("handles files with no extension", () => {
    expect(generateDownloadFilename("noextension", "image/webp")).toBe(
      "noextension-processed.webp"
    );
  });
});
