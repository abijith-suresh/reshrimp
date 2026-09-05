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
import { decodeHeicBlob } from "./formatDetectionService";

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

  // Step 0.5: Decode HEIC/HEIF input to PNG before processing
  if (isHeicInput(file.type)) {
    const decodedBlob = await decodeHeicBlob(file);
    currentFile = new File([decodedBlob], file.name.replace(/\.(?:heic|heif)$/i, ".png"), {
      type: "image/png",
    });
  }

  // Step 1: Remove background if requested
  if (options.removeBackground) {
    const transparentBlob = await removeBackground(currentFile, onBackgroundRemovalProgress);
    currentFile = new File([transparentBlob], currentFile.name, { type: "image/png" });
  }

  // Step 2: Load image (either original or background-removed)
  const img = await loadImage(currentFile);

  if (img.width > MAX_PIXEL_DIMENSION || img.height > MAX_PIXEL_DIMENSION) {
    throw new Error(
      `Image dimensions (${img.width}×${img.height}) exceed the maximum of ${MAX_PIXEL_DIMENSION}px per side`
    );
  }

  // Step 3: Determine dimensions (resize or original)
  let width = img.width;
  let height = img.height;

  if (options.resize) {
    const dimensions = calculateDimensions(img.width, img.height, options.resize);
    width = dimensions.width;
    height = dimensions.height;
  }

  // Step 4: Create canvas with final dimensions
  const canvas = resizeOnCanvas(img, width, height);

  // Step 5: Determine format (convert or original)
  // If background removal is enabled, force PNG to preserve transparency
  let format: ImageFormat;
  if (options.removeBackground) {
    format = "image/png";
  } else {
    format =
      options.format || (isAcceptedInputFormat(currentFile.type) ? currentFile.type : "image/png");
  }
  format = getBestFormat(format);

  // Step 6: Determine quality (compress or default)
  let quality: number | undefined;
  if (supportsBrowserQualityControl(format)) {
    quality = options.quality !== undefined ? options.quality : 0.92;
  }

  // Step 7: Convert to blob
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
