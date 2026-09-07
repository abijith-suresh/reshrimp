import { MAX_PIXEL_DIMENSION } from "../config/constants";
import {
  isAcceptedInputFormat,
  isHeicInput,
  supportsBrowserQualityControl,
} from "../config/imageFormats";
import type { ImageFormat } from "../types/image";
import type {
  BackgroundRemovalProgressCallback,
  ProcessOptions,
  ProcessResult,
  ResizeOptions,
} from "../types/processing";
import { removeBackground } from "./backgroundRemovalService";
import { canvasToBlob, getBestFormat, loadImage, resizeOnCanvas } from "./canvasService";
import { decodeHeicBlob, isHeicBlob } from "./formatDetectionService";

/**
 * Calculate dimensions maintaining aspect ratio
 */
export function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  options: ResizeOptions
): { width: number; height: number } {
  if (!options.maintainAspectRatio) {
    return {
      width: options.width ?? originalWidth,
      height: options.height ?? originalHeight,
    };
  }

  const aspectRatio = originalWidth / originalHeight;

  if (options.width && !options.height) {
    return {
      width: options.width,
      height: Math.round(options.width / aspectRatio),
    };
  }

  if (options.height && !options.width) {
    return {
      width: Math.round(options.height * aspectRatio),
      height: options.height,
    };
  }

  if (options.width && options.height) {
    const widthScale = options.width / originalWidth;
    const heightScale = options.height / originalHeight;
    const scale = Math.min(widthScale, heightScale);

    return {
      width: Math.max(1, Math.round(originalWidth * scale)),
      height: Math.max(1, Math.round(originalHeight * scale)),
    };
  }

  // No dimensions specified, return original
  return { width: originalWidth, height: originalHeight };
}

/**
 * Reject resize targets that cannot produce a valid output: non-positive
 * dimensions and targets beyond the browser-safe canvas limit.
 */
function assertValidResizeTargets(resize: ResizeOptions): void {
  const targets: Array<["Width" | "Height", number | undefined]> = [
    ["Width", resize.width],
    ["Height", resize.height],
  ];

  for (const [label, value] of targets) {
    if (value === undefined) {
      continue;
    }
    if (!Number.isFinite(value) || value < 1) {
      throw new Error(`${label} must be at least 1px`);
    }
    if (value > MAX_PIXEL_DIMENSION) {
      throw new Error(
        `${label} (${value}px) exceeds the maximum of ${MAX_PIXEL_DIMENSION}px per side`
      );
    }
  }
}

/**
 * Process an image with combined operations (resize, format conversion, compression)
 * Operations are applied in order: background removal -> resize -> format conversion -> compression
 *
 * When background removal is enabled, the output is always PNG to preserve transparency.
 */
export async function processImage(
  file: File,
  options: ProcessOptions,
  onBackgroundRemovalProgress?: BackgroundRemovalProgressCallback
): Promise<ProcessResult> {
  let currentFile = file;

  // Step 0.5: Decode HEIC/HEIF input to PNG before processing. Also covers
  // HEIC content that arrives with an empty or generic MIME type.
  if (isHeicInput(file.type) || (await isHeicBlob(file))) {
    const decodedBlob = await decodeHeicBlob(file);
    currentFile = new File([decodedBlob], file.name.replace(/\.(?:heic|heif)$/i, ".png"), {
      type: "image/png",
    });
  }

  // Step 1: Load the source and guard dimensions before any heavy work —
  // background removal downloads a large ML model and must not run for
  // images that would be rejected anyway.
  const sourceImage = await loadImage(currentFile);

  if (sourceImage.width > MAX_PIXEL_DIMENSION || sourceImage.height > MAX_PIXEL_DIMENSION) {
    throw new Error(
      `Image dimensions (${sourceImage.width}×${sourceImage.height}) exceed the maximum of ${MAX_PIXEL_DIMENSION}px per side`
    );
  }

  // Step 2: Remove background if requested
  if (options.removeBackground) {
    const transparentBlob = await removeBackground(currentFile, onBackgroundRemovalProgress);
    currentFile = new File([transparentBlob], currentFile.name, { type: "image/png" });
  }

  // Step 3: Load the working image (the background-removed output when applicable)
  const img = options.removeBackground ? await loadImage(currentFile) : sourceImage;

  // Step 4: Determine dimensions (resize or original)
  let width = img.width;
  let height = img.height;

  if (options.resize) {
    assertValidResizeTargets(options.resize);
    const dimensions = calculateDimensions(img.width, img.height, options.resize);
    width = dimensions.width;
    height = dimensions.height;

    // Aspect-ratio derivation can push an in-range target past the canvas limit
    if (width > MAX_PIXEL_DIMENSION || height > MAX_PIXEL_DIMENSION) {
      throw new Error(
        `Target dimensions (${width}×${height}) exceed the maximum of ${MAX_PIXEL_DIMENSION}px per side`
      );
    }
  }

  // Step 5: Create canvas with final dimensions
  const canvas = resizeOnCanvas(img, width, height);

  // Step 6: Determine format (convert or original)
  // If background removal is enabled, force PNG to preserve transparency
  let format: ImageFormat;
  if (options.removeBackground) {
    format = "image/png";
  } else {
    format =
      options.format || (isAcceptedInputFormat(currentFile.type) ? currentFile.type : "image/png");
  }
  format = getBestFormat(format);

  // Step 7: Determine quality (compress or default)
  let quality: number | undefined;
  if (supportsBrowserQualityControl(format)) {
    quality = options.quality !== undefined ? options.quality : 0.92;
  }

  // Step 8: Convert to blob
  const blob = await canvasToBlob(canvas, format, quality);

  return {
    blob,
    metadata: {
      width,
      height,
      format,
      fileSize: blob.size,
    },
  };
}

/**
 * Extract metadata from an image file
 */
export async function getImageMetadata(file: File) {
  const img = await loadImage(file);
  return {
    width: img.width,
    height: img.height,
    format: file.type,
    fileSize: file.size,
    fileName: file.name,
  };
}
