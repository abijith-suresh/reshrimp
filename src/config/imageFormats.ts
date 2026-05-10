import type { ImageFormat } from "../types/image";

/**
 * Legacy image format lists for backward-compatible consumers.
 * New code should use formatDetectionService for runtime-gated checks.
 */

export type ConvertibleImageFormat = Exclude<
  ImageFormat,
  "image/gif" | "image/heic" | "image/heif"
>;

export const SUPPORTED_IMAGE_FORMATS: ReadonlyArray<ImageFormat> = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/heic",
  "image/heif",
];

export const CONVERTIBLE_IMAGE_FORMATS: ReadonlyArray<ConvertibleImageFormat> = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];

export const IMAGE_FORMAT_LABELS: Record<ImageFormat, string> = {
  "image/jpeg": "JPEG",
  "image/png": "PNG",
  "image/webp": "WebP",
  "image/gif": "GIF",
  "image/avif": "AVIF",
  "image/heic": "HEIC",
  "image/heif": "HEIF",
};

export const UPLOAD_ACCEPT_ATTRIBUTE = SUPPORTED_IMAGE_FORMATS.join(",");

export function getImageFormatLabel(format: ImageFormat): string {
  return IMAGE_FORMAT_LABELS[format];
}

export function getSupportedImageFormatSummary(
  formats: ReadonlyArray<ImageFormat> = SUPPORTED_IMAGE_FORMATS
): string {
  return formats.map((format) => getImageFormatLabel(format)).join(", ");
}
