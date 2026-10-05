import { describe, expect, it } from "vitest";
import {
  getImageFormatLabel,
  getInitialOutputFormat,
  getSupportedImageFormatSummary,
  isAcceptedInputFormat,
  isConvertibleOutputFormat,
  isHeicInput,
  supportsBrowserQualityControl,
  UPLOAD_ACCEPT_ATTRIBUTE,
} from "./imageFormats";

describe("imageFormats", () => {
  it("returns the uploaded format when it is directly convertible", () => {
    expect(getInitialOutputFormat("image/png")).toBe("image/png");
    expect(getInitialOutputFormat("image/avif")).toBe("image/avif");
  });

  it("falls back to jpeg for heic/heif uploads", () => {
    expect(getInitialOutputFormat("image/heic")).toBe("image/jpeg");
    expect(getInitialOutputFormat("image/heif")).toBe("image/jpeg");
  });

  it("falls back to jpeg for unknown upload formats", () => {
    expect(getInitialOutputFormat("image/tiff")).toBe("image/jpeg");
  });

  it("keeps labels in sync with the supported formats", () => {
    expect(getImageFormatLabel("image/webp")).toBe("WebP");
    expect(getImageFormatLabel("image/heif")).toBe("HEIF");
  });

  it.each([
    ["image/jpeg", true],
    ["image/png", true],
    ["image/webp", true],
    ["image/gif", false],
    ["image/avif", true],
    ["image/heic", true],
    ["image/heif", true],
    ["image/svg+xml", false],
    ["image/tiff", false],
  ])("reports accepted input support for %s as %s", (mime, expected) => {
    expect(isAcceptedInputFormat(mime)).toBe(expected);
  });

  it.each([
    ["image/jpeg", true],
    ["image/png", true],
    ["image/webp", true],
    ["image/avif", true],
    ["image/heic", false],
  ])("reports convertible output support for %s as %s", (format, expected) => {
    expect(
      isConvertibleOutputFormat(format as Parameters<typeof isConvertibleOutputFormat>[0])
    ).toBe(expected);
  });

  it.each([
    ["image/heic", true],
    ["image/heif", true],
    ["image/jpeg", false],
    ["image/png", false],
  ])("reports HEIC input support for %s as %s", (mime, expected) => {
    expect(isHeicInput(mime)).toBe(expected);
  });

  it("reports browser quality control support", () => {
    expect(supportsBrowserQualityControl("image/webp")).toBe(true);
    expect(supportsBrowserQualityControl("image/png")).toBe(false);
  });

  it("provides a readable summary of supported upload formats", () => {
    expect(getSupportedImageFormatSummary()).toBe("JPEG, PNG, WebP, AVIF, HEIC, HEIF");
  });

  it("keeps the file-picker filter aligned with accepted input formats", () => {
    expect(UPLOAD_ACCEPT_ATTRIBUTE).toBe(
      "image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif"
    );
  });
});
