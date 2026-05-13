import type { ImageFormat } from "../types/image";
import type {
  ResizeOptions,
  ProcessOptions,
  ProcessResult,
  BackgroundRemovalProgressCallback,
} from "../types/processing";
import { loadImage, resizeOnCanvas, canvasToBlob, getBestFormat } from "./canvasService";
import { removeBackground } from "./backgroundRemovalService";
import { rotateImage, flipImage } from "./transformService";
import { decodeHeicBlob } from "./formatDetectionService";
import { compressToTargetSize, formatSupportsQuality } from "./targetSizeService";
import { isHeicInput } from "../config/imageFormats";
import { buildFilterString, isNoOpAdjustments } from "./adjustmentService";

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
  let img = await loadImage(currentFile);

  // Step 2.5: Apply transforms (rotate / flip) before resize
  if (options.transform) {
    const { rotation, flip } = options.transform;
    if (rotation) {
      const rotCanvas = rotateImage(img, rotation);
      img = await canvasToImageElement(rotCanvas);
    }
    if (flip) {
      const flipCanvas = flipImage(img, flip);
      img = await canvasToImageElement(flipCanvas);
    }
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

  // Step 4.5: Apply image adjustments (brightness, contrast, saturation)
  if (options.adjustments && !isNoOpAdjustments(options.adjustments)) {
    const filterStr = buildFilterString(options.adjustments);
    const adjCtx = canvas.getContext("2d");
    if (adjCtx && filterStr) {
      adjCtx.filter = filterStr;
      adjCtx.drawImage(canvas, 0, 0);
      adjCtx.filter = "none";
    }
  }

  // Step 5: Determine format (convert or original)
  // If background removal is enabled, force PNG to preserve transparency
  let format: ImageFormat;
  if (options.removeBackground) {
    format = "image/png";
  } else {
    format = options.format || (currentFile.type as ImageFormat);
  }
  format = getBestFormat(format);

  // Step 6: Determine quality (compress or default)
  // PNG doesn't benefit from quality setting, so we only apply it for other formats
  let quality: number | undefined;
  if (format === "image/jpeg" || format === "image/webp") {
    quality = options.quality !== undefined ? options.quality : 0.92;
  }

  // Step 7: Convert to blob
  let blob: Blob;

  if (options.targetFileSize && formatSupportsQuality(format)) {
    const sizeResult = await compressToTargetSize(
      { canvas, format, targetBytes: options.targetFileSize },
      canvasToBlob
    );
    blob = sizeResult.blob;
  } else {
    blob = await canvasToBlob(canvas, format, quality);
  }

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
 * Convert a canvas back to an HTMLImageElement so it can be fed into the next step.
 */
function canvasToImageElement(canvas: HTMLCanvasElement): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to convert canvas to image element"));
    img.src = canvas.toDataURL();
  });
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
