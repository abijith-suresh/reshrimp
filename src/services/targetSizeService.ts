/**
 * Target file size export mode.
 *
 * Given a canvas, output format, and a byte ceiling, iteratively compress
 * until the result fits or the quality floor is exhausted.  The algorithm
 * uses a binary search over the quality parameter for efficiency.
 *
 * PNG is always lossless — the function reports hitTarget=false when the
 * natural PNG output exceeds the target.
 */
import {
  supportsBrowserQualityControl,
  type QualityControlledImageFormat,
} from "../config/imageFormats";
import type { ImageFormat } from "../types/image";

export interface TargetFileSizeResult {
  blob: Blob;
  quality: number;
  hitTarget: boolean;
}

export interface TargetFileSizeOptions {
  canvas: HTMLCanvasElement;
  format: ImageFormat;
  targetBytes: number;
  /** Quality floor — stop iterating below this (0-1). Default 0.1 */
  minQuality?: number;
  /** Maximum iterations. Default 10 */
  maxIterations?: number;
}

/**
 * Injected canvas-to-blob function for testability.
 * Production callers pass the real `canvasToBlob` from canvasService.
 */
export type CanvasEncoder = (
  canvas: HTMLCanvasElement,
  format: ImageFormat,
  quality?: number
) => Promise<Blob>;

/**
 * Check whether the given format supports quality-based compression.
 */
export function formatSupportsQuality(format: ImageFormat): format is QualityControlledImageFormat {
  return supportsBrowserQualityControl(format);
}

/**
 * Iteratively compress a canvas toward a target file size.
 *
 * Uses binary search between 1.0 and minQuality to find the best quality
 * that fits within targetBytes.
 *
 * Returns `{ hitTarget: false }` when even minQuality exceeds the target.
 */
export async function compressToTargetSize(
  options: TargetFileSizeOptions,
  encode: CanvasEncoder
): Promise<TargetFileSizeResult> {
  const { canvas, format, targetBytes, minQuality = 0.1, maxIterations = 10 } = options;

  // For formats without quality control, just encode and compare
  if (!formatSupportsQuality(format)) {
    const blob = await encode(canvas, format);
    return {
      blob,
      quality: 1,
      hitTarget: blob.size <= targetBytes,
    };
  }

  let low = minQuality;
  let high = 1.0;
  let bestBlob: Blob | null = null;
  let bestQuality = 0;

  for (let i = 0; i < maxIterations; i++) {
    const mid = Math.round(((low + high) / 2) * 100) / 100;
    const blob = await encode(canvas, format, mid);

    if (blob.size <= targetBytes) {
      bestBlob = blob;
      bestQuality = mid;
      // Try higher quality — we have room
      low = mid;
    } else {
      // Too large — try lower quality
      high = mid;
    }

    // Converged when range is narrower than 1% quality
    if (high - low < 0.01) break;
  }

  // If we never found a fit, use the lowest quality attempt
  if (!bestBlob) {
    const floorBlob = await encode(canvas, format, minQuality);
    return {
      blob: floorBlob,
      quality: minQuality,
      hitTarget: floorBlob.size <= targetBytes,
    };
  }

  return {
    blob: bestBlob,
    quality: bestQuality,
    hitTarget: true,
  };
}
