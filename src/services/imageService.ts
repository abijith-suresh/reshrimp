import type { ImageFormat } from '../types/image';
import type { ResizeOptions, ProcessOptions, ProcessResult } from '../types/processing';
import { loadImage, resizeOnCanvas, canvasToBlob, getBestFormat } from './canvasService';

/**
 * Calculate dimensions maintaining aspect ratio
 */
function calculateDimensions(
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
    // Both specified, use width and calculate height to maintain aspect ratio
    return {
      width: options.width,
      height: Math.round(options.width / aspectRatio),
    };
  }

  // No dimensions specified, return original
  return { width: originalWidth, height: originalHeight };
}

/**
 * Resize an image file with optional aspect ratio preservation
 */
export async function resizeImage(file: File, options: ResizeOptions): Promise<Blob> {
  const img = await loadImage(file);
  const dimensions = calculateDimensions(img.width, img.height, options);
  const canvas = resizeOnCanvas(img, dimensions.width, dimensions.height);

  // Use original format for resize-only operation
  const format = file.type as ImageFormat;
  return canvasToBlob(canvas, getBestFormat(format));
}

/**
 * Convert image file to a different format
 */
export async function convertFormat(file: File, targetFormat: ImageFormat): Promise<Blob> {
  const img = await loadImage(file);
  const canvas = resizeOnCanvas(img, img.width, img.height);
  return canvasToBlob(canvas, getBestFormat(targetFormat));
}

/**
 * Compress an image with specified quality level
 * Quality range: 0.0 (lowest) to 1.0 (highest)
 */
export async function compressImage(file: File, quality: number): Promise<Blob> {
  const img = await loadImage(file);
  const canvas = resizeOnCanvas(img, img.width, img.height);

  // Clamp quality between 0 and 1
  const clampedQuality = Math.max(0, Math.min(1, quality));

  // Use original format or default to JPEG for compression
  let format = file.type as ImageFormat;
  if (format === 'image/gif' || format === 'image/png') {
    // PNG and GIF don't support quality parameter well, convert to JPEG
    format = 'image/jpeg';
  }

  return canvasToBlob(canvas, getBestFormat(format), clampedQuality);
}

/**
 * Process an image with combined operations (resize, format conversion, compression)
 * Operations are applied in order: resize -> format conversion -> compression
 */
export async function processImage(file: File, options: ProcessOptions): Promise<ProcessResult> {
  const img = await loadImage(file);

  // Step 1: Determine dimensions (resize or original)
  let width = img.width;
  let height = img.height;

  if (options.resize) {
    const dimensions = calculateDimensions(img.width, img.height, options.resize);
    width = dimensions.width;
    height = dimensions.height;
  }

  // Step 2: Create canvas with final dimensions
  const canvas = resizeOnCanvas(img, width, height);

  // Step 3: Determine format (convert or original)
  let format: ImageFormat = options.format || (file.type as ImageFormat);
  format = getBestFormat(format);

  // Step 4: Determine quality (compress or default)
  const quality = options.quality !== undefined ? options.quality : 0.92;

  // Step 5: Convert to blob
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
