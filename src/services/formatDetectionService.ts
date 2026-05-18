/**
 * Format detection and HEIC/HEIF decoding utilities.
 *
 * HEIC/HEIF decoding has moved to heicDecoderService.ts for a lighter
 * dual-path strategy (native-first, heic2any fallback).
 *
 * This module retains format detection and AVIF support probing.
 */
export { decodeHeicBlob } from "./heicDecoderService";

/**
 * Detect whether the browser can encode AVIF output.
 *
 * Uses a small canvas + toBlob probe. Result should be cached by the caller.
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
