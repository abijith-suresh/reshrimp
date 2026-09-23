import type { ImageFormat } from "../types/image";

/**
 * Load an image from a File object into an HTMLImageElement
 */
export async function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}

/**
 * Resize an image on a canvas element
 * Returns a canvas with the resized image drawn on it
 */
export function resizeOnCanvas(
  img: HTMLImageElement,
  width: number,
  height: number
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  // Use high-quality image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.drawImage(img, 0, 0, width, height);

  return canvas;
}

/**
 * Convert a canvas to a Blob with specified format and quality
 * Returns a Promise that resolves to the Blob
 */
export async function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: ImageFormat = "image/png",
  quality: number = 0.92
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // Canvas re-encodes pixel data into a fresh file, so EXIF metadata is not preserved.
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error(`Failed to convert canvas to ${format}`));
        }
      },
      format,
      quality
    );
  });
}

export interface FileSizeTargetResult {
  blob: Blob;
  targetReached: boolean;
}

const MIN_TARGET_QUALITY = 0.01;
const FILE_SIZE_SEARCH_STEPS = 6;

/**
 * Encode the highest quality found under a byte limit. If the smallest
 * attempted encoding is still over the limit, return that smallest attempt.
 */
export async function canvasToBlobAtFileSizeTarget(
  canvas: HTMLCanvasElement,
  format: ImageFormat,
  maximumBytes: number
): Promise<FileSizeTargetResult> {
  if (!Number.isSafeInteger(maximumBytes) || maximumBytes < 1) {
    throw new Error("Maximum file size must be a positive whole number of bytes");
  }

  const highestQualityBlob = await canvasToBlob(canvas, format, 1);
  if (highestQualityBlob.size <= maximumBytes) {
    return { blob: highestQualityBlob, targetReached: true };
  }

  const lowestQualityBlob = await canvasToBlob(canvas, format, MIN_TARGET_QUALITY);
  if (lowestQualityBlob.size > maximumBytes) {
    return { blob: lowestQualityBlob, targetReached: false };
  }

  let bestBlob = lowestQualityBlob;
  let lowQuality = MIN_TARGET_QUALITY;
  let highQuality = 1;

  for (let step = 0; step < FILE_SIZE_SEARCH_STEPS; step += 1) {
    const quality = (lowQuality + highQuality) / 2;
    const candidate = await canvasToBlob(canvas, format, quality);

    if (candidate.size <= maximumBytes) {
      bestBlob = candidate;
      lowQuality = quality;
    } else {
      highQuality = quality;
    }
  }

  return { blob: bestBlob, targetReached: true };
}

/**
 * Check if the browser supports a specific image format
 */
export function supportsFormat(format: ImageFormat): boolean {
  const canvas = document.createElement("canvas");
  const dataUrl = canvas.toDataURL(format);
  return dataUrl.startsWith(`data:${format}`);
}

/**
 * Get the best supported format, falling back to PNG if needed
 */
export function getBestFormat(requestedFormat: ImageFormat): ImageFormat {
  if (supportsFormat(requestedFormat)) {
    return requestedFormat;
  }

  return "image/png";
}
