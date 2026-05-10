import type { ImageFormat } from "../types/image";

/**
 * MIME types accepted for upload, including HEIC/HEIF input and AVIF input.
 */
export const ACCEPTED_INPUT_FORMATS: readonly string[] = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/heic",
  "image/heif",
];

/**
 * Image formats available for output conversion.
 * AVIF is included here; runtime gating (detectAvifSupport) determines
 * whether it's offered to the user.
 */
export const CONVERTIBLE_OUTPUT_FORMATS: readonly ImageFormat[] = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];

/**
 * Format labels for UI display.
 */
export const IMAGE_FORMAT_LABELS: Record<ImageFormat, string> = {
  "image/jpeg": "JPEG",
  "image/png": "PNG",
  "image/webp": "WebP",
  "image/gif": "GIF",
  "image/avif": "AVIF",
  "image/heic": "HEIC",
  "image/heif": "HEIF",
};

/**
 * Check whether a MIME type is an accepted input format.
 */
export function isAcceptedInputFormat(mimeType: string): boolean {
  return ACCEPTED_INPUT_FORMATS.includes(mimeType);
}

/**
 * Check whether a format is available for output conversion.
 */
export function isConvertibleOutputFormat(format: ImageFormat): boolean {
  return CONVERTIBLE_OUTPUT_FORMATS.includes(format);
}

/**
 * Check whether a MIME type represents HEIC/HEIF input that needs decoding.
 */
export function isHeicInput(mimeType: string): boolean {
  return mimeType === "image/heic" || mimeType === "image/heif";
}

/**
 * Detect whether the browser can encode AVIF output.
 *
 * Uses a small canvas + toBlob probe.  Result should be cached by the caller.
 */
export function detectAvifSupport(): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      canvas.toBlob(
        (blob) => {
          resolve(blob !== null && blob.type === "image/avif");
        },
        "image/avif",
        0.5
      );
    } catch {
      resolve(false);
    }
  });
}

/**
 * Decode a HEIC/HEIF blob into a PNG blob using the heic2any library.
 *
 * The conversion happens entirely in-browser; no data leaves the device.
 */
export async function decodeHeicBlob(blob: Blob): Promise<Blob> {
  const { default: heic2any } = await import("heic2any");
  const result = await heic2any({ blob, toType: "image/png" });
  return Array.isArray(result) ? result[0]! : result;
}
