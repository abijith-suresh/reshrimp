import type { ImageFormat } from "../types/image";

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

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.drawImage(img, 0, 0, width, height);

  return canvas;
}

export async function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: ImageFormat = "image/png",
  quality: number = 0.92
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // Canvas encoding removes source EXIF metadata.
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

// Keep the highest tested quality that fits, or the smallest output if none fits.
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
    // Lower quality can produce a larger file.
    const smallestBlob =
      lowestQualityBlob.size < highestQualityBlob.size ? lowestQualityBlob : highestQualityBlob;
    return { blob: smallestBlob, targetReached: false };
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

export function supportsFormat(format: ImageFormat): boolean {
  const canvas = document.createElement("canvas");
  const dataUrl = canvas.toDataURL(format);
  return dataUrl.startsWith(`data:${format}`);
}

export function getBestFormat(requestedFormat: ImageFormat): ImageFormat {
  if (supportsFormat(requestedFormat)) {
    return requestedFormat;
  }

  return "image/png";
}
