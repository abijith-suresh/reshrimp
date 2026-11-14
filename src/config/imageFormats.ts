import type { ImageFormat } from "../types/image";

// AVIF is read but not offered as output: Chromium and Firefox canvases cannot encode it.
type ConvertibleImageFormat = Exclude<ImageFormat, "image/avif" | "image/heic" | "image/heif">;
type QualityControlledImageFormat = Extract<ImageFormat, "image/jpeg" | "image/webp">;

const ACCEPTED_INPUT_FORMATS: readonly ImageFormat[] = [
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
];

const QUALITY_CONTROLLED_OUTPUT_FORMATS: readonly QualityControlledImageFormat[] = [
  "image/jpeg",
  "image/webp",
];

const IMAGE_FORMAT_LABELS: Record<ImageFormat, string> = {
  "image/jpeg": "JPEG",
  "image/png": "PNG",
  "image/webp": "WebP",
  "image/avif": "AVIF",
  "image/heic": "HEIC",
  "image/heif": "HEIF",
};

// Extensions too: some systems report no MIME type for HEIC files, and the picker would hide them.
export const UPLOAD_ACCEPT_ATTRIBUTE = `${ACCEPTED_INPUT_FORMATS.join(",")},.heic,.heif`;

export function getImageFormatLabel(format: ImageFormat): string {
  return IMAGE_FORMAT_LABELS[format];
}

// HEIF is folded into HEIC, the name people know.
export function getSupportedImageFormatSummary(): string {
  return ACCEPTED_INPUT_FORMATS.filter((format) => format !== "image/heif")
    .map((format) => getImageFormatLabel(format))
    .join(", ");
}

export function isAcceptedInputFormat(mimeType: string): mimeType is ImageFormat {
  return (ACCEPTED_INPUT_FORMATS as readonly string[]).includes(mimeType);
}

export function isConvertibleOutputFormat(format: ImageFormat): format is ConvertibleImageFormat {
  return (CONVERTIBLE_OUTPUT_FORMATS as readonly ImageFormat[]).includes(format);
}

export function supportsBrowserQualityControl(
  format: ImageFormat
): format is QualityControlledImageFormat {
  return (QUALITY_CONTROLLED_OUTPUT_FORMATS as readonly ImageFormat[]).includes(format);
}

export function isHeicInput(mimeType: string): boolean {
  return mimeType === "image/heic" || mimeType === "image/heif";
}

export function getInitialOutputFormat(uploadFormat: string): ConvertibleImageFormat {
  return isAcceptedInputFormat(uploadFormat) && isConvertibleOutputFormat(uploadFormat)
    ? uploadFormat
    : "image/jpeg";
}
