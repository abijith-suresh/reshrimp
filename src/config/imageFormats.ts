import type { ImageFormat } from "../types/image";

export type ConvertibleImageFormat = Exclude<ImageFormat, "image/heic" | "image/heif">;

export const ACCEPTED_INPUT_FORMATS: readonly ImageFormat[] = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/heic",
  "image/heif",
];

export const CONVERTIBLE_OUTPUT_FORMATS: readonly ConvertibleImageFormat[] = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];

/**
 * Legacy aliases kept for existing callers while the codebase converges on
 * input/output terminology.
 */
export const SUPPORTED_IMAGE_FORMATS = ACCEPTED_INPUT_FORMATS;
export const CONVERTIBLE_IMAGE_FORMATS = CONVERTIBLE_OUTPUT_FORMATS;

export const IMAGE_FORMAT_LABELS: Record<ImageFormat, string> = {
  "image/jpeg": "JPEG",
  "image/png": "PNG",
  "image/webp": "WebP",
  "image/avif": "AVIF",
  "image/heic": "HEIC",
  "image/heif": "HEIF",
};

export const UPLOAD_ACCEPT_ATTRIBUTE = ACCEPTED_INPUT_FORMATS.join(",");

export function getImageFormatLabel(format: ImageFormat): string {
  return IMAGE_FORMAT_LABELS[format];
}

export function getSupportedImageFormatSummary(
  formats: ReadonlyArray<ImageFormat> = ACCEPTED_INPUT_FORMATS
): string {
  return formats.map((format) => getImageFormatLabel(format)).join(", ");
}

export function isAcceptedInputFormat(mimeType: string): mimeType is ImageFormat {
  return ACCEPTED_INPUT_FORMATS.includes(mimeType as ImageFormat);
}

export function isConvertibleOutputFormat(format: ImageFormat): format is ConvertibleImageFormat {
  return CONVERTIBLE_OUTPUT_FORMATS.includes(format as ConvertibleImageFormat);
}

export function isHeicInput(mimeType: string): boolean {
  return mimeType === "image/heic" || mimeType === "image/heif";
}

export function getInitialOutputFormat(uploadFormat: string): ConvertibleImageFormat {
  return isConvertibleOutputFormat(uploadFormat as ImageFormat)
    ? (uploadFormat as ConvertibleImageFormat)
    : "image/jpeg";
}
