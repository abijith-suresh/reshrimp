import { describe, expect, it } from "vitest";
import {
  ACCEPTED_INPUT_FORMATS,
  CONVERTIBLE_OUTPUT_FORMATS,
  IMAGE_FORMAT_LABELS,
  QUALITY_CONTROLLED_OUTPUT_FORMATS,
  UPLOAD_ACCEPT_ATTRIBUTE,
  getImageFormatLabel,
  getInitialOutputFormat,
  getQualityControlNotice,
  getSupportedImageFormatSummary,
  isAcceptedInputFormat,
  isConvertibleOutputFormat,
  isHeicInput,
  supportsBrowserQualityControl,
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

  it("exposes accepted input formats through the upload accept attribute", () => {
    expect(UPLOAD_ACCEPT_ATTRIBUTE).toBe(ACCEPTED_INPUT_FORMATS.join(","));
  });

  it("keeps labels in sync with the supported formats", () => {
    expect(getImageFormatLabel("image/webp")).toBe("WebP");
    expect(IMAGE_FORMAT_LABELS["image/heif"]).toBe("HEIF");
  });

  it("reports format support helpers consistently", () => {
    expect(isAcceptedInputFormat("image/png")).toBe(true);
    expect(isAcceptedInputFormat("image/tiff")).toBe(false);
    expect(isConvertibleOutputFormat("image/avif")).toBe(true);
    expect(isConvertibleOutputFormat("image/heic")).toBe(false);
    expect(supportsBrowserQualityControl("image/webp")).toBe(true);
    expect(supportsBrowserQualityControl("image/png")).toBe(false);
    expect(getQualityControlNotice("image/png")).toContain("lossless");
    expect(getQualityControlNotice("image/avif")).toContain("built-in AVIF encoder");
    expect(isHeicInput("image/heif")).toBe(true);
    expect(isHeicInput("image/png")).toBe(false);
  });

  it("provides a readable summary of supported upload formats", () => {
    expect(getSupportedImageFormatSummary()).toBe("JPEG, PNG, WebP, AVIF, HEIC, HEIF");
  });

  it("keeps accepted and convertible format lists stable", () => {
    expect(ACCEPTED_INPUT_FORMATS).toEqual([
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/avif",
      "image/heic",
      "image/heif",
    ]);
    expect(CONVERTIBLE_OUTPUT_FORMATS).toEqual([
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/avif",
    ]);
    expect(QUALITY_CONTROLLED_OUTPUT_FORMATS).toEqual(["image/jpeg", "image/webp"]);
  });
});
