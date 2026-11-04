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

// Keyed by File so repeated edits reuse work and a new upload releases it.
const backgroundRemovalResults = new WeakMap<File, Promise<File>>();
const decodedImages = new WeakMap<File, Promise<HTMLImageElement>>();
const preparedFiles = new WeakSet<File>();

async function getCached<T>(
  cache: WeakMap<File, Promise<T>>,
  key: File,
  create: () => Promise<T>
): Promise<T> {
  let result = cache.get(key);
  if (!result) {
    result = create();
    cache.set(key, result);
  }

  try {
    return await result;
  } catch (error) {
    if (cache.get(key) === result) {
      cache.delete(key);
    }
    throw error;
  }
}

function getBackgroundRemovedFile(
  cacheKeyFile: File,
  imageFile: File,
  onProgress?: BackgroundRemovalProgressCallback
): Promise<File> {
  return getCached(backgroundRemovalResults, cacheKeyFile, async () => {
    const blob = await removeBackground(imageFile, onProgress);
    return new File([blob], imageFile.name, { type: "image/png" });
  });
}

function decodeImage(file: File): Promise<HTMLImageElement> {
  return getCached(decodedImages, file, () => loadImage(file));
}

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

  return { width: originalWidth, height: originalHeight };
}

interface PreparedImageFile {
  file: File;
  format: string;
}

// Keep the input format when HEIC decoding creates a PNG working file.
export async function prepareImageFile(file: File): Promise<PreparedImageFile> {
  if (preparedFiles.has(file)) {
    return { file, format: file.type };
  }

  const isHeic = isHeicInput(file.type) || (await isHeicBlob(file));
  if (!isHeic) {
    preparedFiles.add(file);
    return { file, format: file.type };
  }

  const decodedBlob = await decodeHeicBlob(file);
  const preparedFile = new File([decodedBlob], file.name.replace(/\.(?:heic|heif)$/i, ".png"), {
    type: "image/png",
  });
  preparedFiles.add(preparedFile);
  return {
    file: preparedFile,
    format: isHeicInput(file.type) ? file.type : "image/heic",
  };
}

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

  let currentFile = (await prepareImageFile(file)).file;

  // Check source dimensions before the model downloads.
  const sourceImage = await decodeImage(currentFile);

  assertWithinPixelLimits(sourceImage.width, sourceImage.height, "Image");

  if (options.removeBackground) {
    currentFile = await getBackgroundRemovedFile(file, currentFile, onBackgroundRemovalProgress);
  }

  const img = options.removeBackground ? await decodeImage(currentFile) : sourceImage;
  assertWithinPixelLimits(img.width, img.height, "Image");

  let width = img.width;
  let height = img.height;

  if (options.resize) {
    assertValidResizeTargets(options.resize);
    const dimensions = calculateDimensions(img.width, img.height, options.resize);
    width = dimensions.width;
    height = dimensions.height;

    // The derived dimension can exceed the canvas limit.
    assertWithinPixelLimits(width, height, "Target");
  }

  const canvas = resizeOnCanvas(img, width, height);

  let requestedFormat: ImageFormat;
  if (options.removeBackground) {
    requestedFormat = "image/png";
  } else {
    requestedFormat =
      options.format || (isAcceptedInputFormat(currentFile.type) ? currentFile.type : "image/png");
  }
  const format = getBestFormat(requestedFormat);

  let blob: Blob;
  let targetFileSizeStatus: ProcessResult["metadata"]["targetFileSizeStatus"];

  try {
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
      let quality: number | undefined;
      if (supportsBrowserQualityControl(format)) {
        quality = options.quality !== undefined ? options.quality : 0.92;
      }

      blob = await canvasToBlob(canvas, format, quality);
    }
  } finally {
    // iOS Safari caps total canvas memory; free the backing store now.
    canvas.width = 0;
    canvas.height = 0;
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

export async function getImageMetadata(file: File, format = file.type) {
  const img = await decodeImage(file);
  return {
    width: img.width,
    height: img.height,
    format,
    fileSize: file.size,
    fileName: file.name,
  };
}
