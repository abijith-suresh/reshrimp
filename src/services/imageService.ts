import { MAX_PIXEL_DIMENSION, MAX_TOTAL_PIXELS } from "../config/constants";
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
import {
  canvasToBlob,
  canvasToBlobAtFileSizeTarget,
  getBestFormat,
  loadImage,
  resizeOnCanvas,
} from "./canvasService";
import { decodeHeicBlob, isHeicBlob } from "./formatDetectionService";

const backgroundRemovalResults = new WeakMap<File, Promise<Blob>>();

async function getBackgroundRemovedBlob(
  cacheKeyFile: File,
  imageFile: File,
  onProgress?: BackgroundRemovalProgressCallback
): Promise<Blob> {
  let result = backgroundRemovalResults.get(cacheKeyFile);
  if (!result) {
    result = removeBackground(imageFile, onProgress);
    backgroundRemovalResults.set(cacheKeyFile, result);
  }

  try {
    return await result;
  } catch (error) {
    if (backgroundRemovalResults.get(cacheKeyFile) === result) {
      backgroundRemovalResults.delete(cacheKeyFile);
    }
    throw error;
  }
}

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
      height: Math.max(1, Math.round(options.width / aspectRatio)),
    };
  }

  if (options.height && !options.width) {
    return {
      width: Math.max(1, Math.round(options.height * aspectRatio)),
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

interface PreparedImageFile {
  file: File;
  format: string;
}

/**
 * Normalize browser-unsupported HEIC/HEIF input before metadata extraction.
 * The original format is retained separately so the UI can choose a sensible
 * output format after the working file has been decoded to PNG.
 */
export async function prepareImageFile(file: File): Promise<PreparedImageFile> {
  const isHeic = isHeicInput(file.type) || (await isHeicBlob(file));
  if (!isHeic) {
    return { file, format: file.type };
  }

  const decodedBlob = await decodeHeicBlob(file);
  return {
    file: new File([decodedBlob], file.name.replace(/\.(?:heic|heif)$/i, ".png"), {
      type: "image/png",
    }),
    format: isHeicInput(file.type) ? file.type : "image/heic",
  };
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

function assertWithinPixelLimits(width: number, height: number, label: string): void {
  if (width > MAX_PIXEL_DIMENSION || height > MAX_PIXEL_DIMENSION) {
    throw new Error(
      `${label} dimensions (${width}×${height}) exceed the maximum of ${MAX_PIXEL_DIMENSION}px per side`
    );
  }

  if (width * height > MAX_TOTAL_PIXELS) {
    throw new Error(
      `${label} dimensions (${width}×${height}) exceed the maximum pixel budget of ${MAX_TOTAL_PIXELS.toLocaleString()} pixels`
    );
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
  if (
    options.targetFileSizeBytes !== undefined &&
    (!Number.isSafeInteger(options.targetFileSizeBytes) || options.targetFileSizeBytes < 1)
  ) {
    throw new Error("Maximum file size must be a positive whole number of bytes");
  }

  // Step 0.5: Decode HEIC/HEIF input to PNG before processing. Also covers
  // HEIC content that arrives with an empty or generic MIME type.
  let currentFile = (await prepareImageFile(file)).file;

  // Step 1: Load the source and guard dimensions before any heavy work —
  // background removal downloads a large ML model and must not run for
  // images that would be rejected anyway.
  const sourceImage = await loadImage(currentFile);

  assertWithinPixelLimits(sourceImage.width, sourceImage.height, "Image");

  // Step 2: Remove background if requested
  if (options.removeBackground) {
    const transparentBlob = await getBackgroundRemovedBlob(
      file,
      currentFile,
      onBackgroundRemovalProgress
    );
    currentFile = new File([transparentBlob], currentFile.name, { type: "image/png" });
  }

  // Step 3: Load the working image (the background-removed output when applicable)
  const img = options.removeBackground ? await loadImage(currentFile) : sourceImage;
  assertWithinPixelLimits(img.width, img.height, "Image");

  // Step 4: Determine dimensions (resize or original)
  let width = img.width;
  let height = img.height;

  if (options.resize) {
    assertValidResizeTargets(options.resize);
    const dimensions = calculateDimensions(img.width, img.height, options.resize);
    width = dimensions.width;
    height = dimensions.height;

    // Aspect-ratio derivation can push an in-range target past the canvas limit
    assertWithinPixelLimits(width, height, "Target");
  }

  // Step 5: Create canvas with final dimensions
  const canvas = resizeOnCanvas(img, width, height);

  // Step 6: Determine format (convert or original)
  // If background removal is enabled, force PNG to preserve transparency
  let requestedFormat: ImageFormat;
  if (options.removeBackground) {
    requestedFormat = "image/png";
  } else {
    requestedFormat =
      options.format || (isAcceptedInputFormat(currentFile.type) ? currentFile.type : "image/png");
  }
  const format = getBestFormat(requestedFormat);

  // Step 7: Encode at a best-effort quality when a target is available.
  let blob: Blob;
  let targetFileSizeStatus: ProcessResult["metadata"]["targetFileSizeStatus"];

  if (options.targetFileSizeBytes !== undefined) {
    if (supportsBrowserQualityControl(format)) {
      const targetResult = await canvasToBlobAtFileSizeTarget(
        canvas,
        format,
        options.targetFileSizeBytes
      );
      blob = targetResult.blob;
      targetFileSizeStatus = targetResult.targetReached ? "met" : "unmet";
    } else {
      blob = await canvasToBlob(canvas, format);
      targetFileSizeStatus = "unsupported";
    }
  } else {
    // Manual quality controls apply to JPEG/WebP/AVIF; other formats are lossless.
    let quality: number | undefined;
    if (supportsBrowserQualityControl(format)) {
      quality = options.quality !== undefined ? options.quality : 0.92;
    }

    blob = await canvasToBlob(canvas, format, quality);
  }

  return {
    blob,
    requestedFormat,
    metadata: {
      width,
      height,
      format,
      fileSize: blob.size,
      ...(options.targetFileSizeBytes !== undefined
        ? {
            targetFileSizeBytes: options.targetFileSizeBytes,
            targetFileSizeStatus,
          }
        : {}),
    },
  };
}

/**
 * Extract metadata from an image file
 */
export async function getImageMetadata(file: File, format = file.type) {
  const img = await loadImage(file);
  return {
    width: img.width,
    height: img.height,
    format,
    fileSize: file.size,
    fileName: file.name,
  };
}
