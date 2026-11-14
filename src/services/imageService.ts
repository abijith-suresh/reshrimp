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
    // A pair already linked at the source ratio is exact; refitting it can lose a pixel.
    if (
      Math.round((options.width * originalHeight) / originalWidth) === options.height ||
      Math.round((options.height * originalWidth) / originalHeight) === options.width
    ) {
      return { width: options.width, height: options.height };
    }

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

  const format = isHeicInput(file.type) ? file.type : "image/heic";
  let decodedBlob: Blob;
  try {
    decodedBlob = await decodeHeicBlob(file);
  } catch {
    // Mislabelled files and HEIC variants the browser reads natively still load directly.
    preparedFiles.add(file);
    return { file, format };
  }
  const preparedFile = new File([decodedBlob], file.name.replace(/\.(?:heic|heif)$/i, ".png"), {
    type: "image/png",
  });
  preparedFiles.add(preparedFile);
  return { file: preparedFile, format };
}

const maxSide = MAX_PIXEL_DIMENSION.toLocaleString("en-US");
const maxMegapixels = MAX_TOTAL_PIXELS / 1_000_000;

function assertValidResizeTargets(resize: ResizeOptions): void {
  const targets: Array<["width" | "height", number | undefined]> = [
    ["width", resize.width],
    ["height", resize.height],
  ];

  for (const [label, value] of targets) {
    if (value === undefined) {
      continue;
    }
    if (!Number.isFinite(value)) {
      throw new Error(`Enter a ${label} in numbers, 1 px or more.`);
    }
    if (value < 1) {
      throw new Error(`Enter a ${label} of 1 px or more.`);
    }
    if (value > MAX_PIXEL_DIMENSION) {
      throw new Error(`Enter a ${label} of ${maxSide} px or less.`);
    }
  }
}

function exceedsPixelLimits(width: number, height: number): boolean {
  return (
    width > MAX_PIXEL_DIMENSION || height > MAX_PIXEL_DIMENSION || width * height > MAX_TOTAL_PIXELS
  );
}

function assertSourceWithinPixelLimits(width: number, height: number): void {
  if (exceedsPixelLimits(width, height)) {
    const megapixels = Number(((width * height) / 1_000_000).toFixed(2));
    throw new Error(
      `This image is ${width} × ${height} px (${megapixels} megapixels). Reshrimp opens images up to ${maxMegapixels} megapixels and ${maxSide} px per side.`
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
  let img = await decodeImage(currentFile);
  assertSourceWithinPixelLimits(img.width, img.height);

  if (options.removeBackground) {
    currentFile = await getBackgroundRemovedFile(file, currentFile, onBackgroundRemovalProgress);
    img = await decodeImage(currentFile);
    assertSourceWithinPixelLimits(img.width, img.height);
  }

  let width = img.width;
  let height = img.height;

  if (options.resize) {
    assertValidResizeTargets(options.resize);
    const dimensions = calculateDimensions(img.width, img.height, options.resize);
    width = dimensions.width;
    height = dimensions.height;

    // The derived dimension can exceed the canvas limit.
    if (exceedsPixelLimits(width, height)) {
      throw new Error(
        `That size (${width} × ${height} px) is too large. Keep each side to ${maxSide} px or less and the total to ${maxMegapixels} megapixels or less.`
      );
    }
  }

  let requestedFormat: ImageFormat;
  if (options.removeBackground) {
    requestedFormat = "image/png";
  } else {
    requestedFormat =
      options.format || (isAcceptedInputFormat(currentFile.type) ? currentFile.type : "image/png");
  }
  const format = getBestFormat(requestedFormat);
  const canvas = resizeOnCanvas(img, width, height, format);

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
