import { describe, it, expect } from "vitest";
import {
  getSupportedFormats,
  isSupportedFormat,
  validateImageFile,
  getFileExtension,
  generateDownloadFilename,
} from "./validationService";
import type { ImageFormat } from "../types/image";

/**
 * Helper to create a File with a specific size.
 * jsdom's File ignores the `size` property of options, so we override it.
 */
function makeFile(name: string, type: string, sizeBytes: number): File {
  const file = new File([], name, { type });
  Object.defineProperty(file, "size", { value: sizeBytes, writable: false });
  return file;
}

const MB = 1024 * 1024;

describe("getSupportedFormats", () => {
  it("returns all accepted input formats", () => {
    expect(getSupportedFormats()).toHaveLength(6);
  });

  it("contains the expected formats", () => {
    expect(getSupportedFormats()).toEqual(
      expect.arrayContaining(["image/jpeg", "image/png", "image/webp"])
    );
  });

  it("returns a new array each call (not mutated between calls)", () => {
    const a = getSupportedFormats();
    const b = getSupportedFormats();
    expect(a).not.toBe(b);
  });
});

describe("isSupportedFormat", () => {
  it("returns true for supported formats", () => {
    expect(isSupportedFormat("image/jpeg")).toBe(true);
    expect(isSupportedFormat("image/png")).toBe(true);
    expect(isSupportedFormat("image/webp")).toBe(true);
    expect(isSupportedFormat("image/gif")).toBe(false);
  });

  it("returns false for unsupported formats", () => {
    expect(isSupportedFormat("image/bmp")).toBe(false);
    expect(isSupportedFormat("application/pdf")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isSupportedFormat("")).toBe(false);
  });

  it("is case-sensitive — rejects mixed-case MIME types", () => {
    expect(isSupportedFormat("image/JPEG")).toBe(false);
    expect(isSupportedFormat("Image/jpeg")).toBe(false);
  });
});

describe("validateImageFile", () => {
  it("returns error when file is null/falsy", () => {
    // @ts-expect-error — testing null input
    const result = validateImageFile(null);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("returns error for non-image file type", () => {
    const file = makeFile("doc.pdf", "application/pdf", 1000);
    const result = validateImageFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/image/i);
  });

  it("returns error for unsupported image format and includes format name in message", () => {
    const file = makeFile("image.bmp", "image/bmp", 1000);
    const result = validateImageFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("image/bmp");
  });

  it("returns error when file exceeds 50 MB hard limit", () => {
    const file = makeFile("big.png", "image/png", 51 * MB);
    const result = validateImageFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("returns valid=true with a warning for files between 10 MB and 50 MB", () => {
    const file = makeFile("medium.png", "image/png", 20 * MB);
    const result = validateImageFile(file);
    expect(result.valid).toBe(true);
    expect(result.warning).toBeDefined();
  });

  it("returns valid=true with no warning for files at or below 10 MB", () => {
    const file = makeFile("small.png", "image/png", 5 * MB);
    const result = validateImageFile(file);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
    expect(result.warning).toBeUndefined();
  });

  it("returns valid=true with no warning at exactly 10 MB", () => {
    const file = makeFile("exact10.png", "image/png", 10 * MB);
    const result = validateImageFile(file);
    expect(result.valid).toBe(true);
    expect(result.warning).toBeUndefined();
  });

  it("returns valid=true with warning at exactly 10 MB + 1 byte", () => {
    const file = makeFile("over10.png", "image/png", 10 * MB + 1);
    const result = validateImageFile(file);
    expect(result.valid).toBe(true);
    expect(result.warning).toBeDefined();
  });

  it("returns error at exactly 50 MB + 1 byte", () => {
    const file = makeFile("over50.png", "image/png", 50 * MB + 1);
    const result = validateImageFile(file);
    expect(result.valid).toBe(false);
  });

  it("returns valid=true at exactly 50 MB", () => {
    const file = makeFile("exact50.png", "image/png", 50 * MB);
    const result = validateImageFile(file);
    expect(result.valid).toBe(true);
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

  it("uses the correct extension for the target format", () => {
    expect(generateDownloadFilename("image.png", "image/jpeg")).toBe("image-processed.jpg");
  });
});
