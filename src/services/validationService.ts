import {
  MAX_FILE_SIZE,
  MAX_PIXEL_DIMENSION,
  MAX_TOTAL_PIXELS,
  RECOMMENDED_MAX_SIZE,
} from "../config/constants";
import { getSupportedImageFormatSummary, isAcceptedInputFormat } from "../config/imageFormats";
import type { ImageFormat, ImageMetadata, ValidationResult } from "../types/image";
import type { ResizeOptions } from "../types/processing";
import { formatFileSize } from "../utils/imageUtils";
import { isHeicBlob } from "./formatDetectionService";
import { calculateDimensions } from "./imageWorkflowService";

/**
 * Validate an image file for processing
 * Returns validation result with error or warning messages
 */
export async function validateImageFile(file: File): Promise<ValidationResult> {
  // Check if file exists
  if (!file) {
    return {
      valid: false,
      error: "No file provided",
    };
  }

  // Check if it's an image file. Devices that export HEIC with an empty or
  // generic MIME type are still accepted when the magic bytes confirm HEIC.
  if (!file.type.startsWith("image/")) {
    if (!(await isHeicBlob(file))) {
      return {
        valid: false,
        error: "File must be an image",
      };
    }
  } else if (!isAcceptedInputFormat(file.type)) {
    // Check if format is supported (including HEIC/HEIF/AVIF)
    return {
      valid: false,
      error: `Unsupported image format: ${file.type}. Supported formats: ${getSupportedImageFormatSummary()}`,
    };
  }

  // Check if file is too large (hard limit)
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size (${formatFileSize(file.size)}) exceeds maximum limit of ${formatFileSize(MAX_FILE_SIZE)}`,
    };
  }

  const warnings: string[] = [];

  // Warn if file is large but still processable
  if (file.size > RECOMMENDED_MAX_SIZE) {
    warnings.push(`Large file detected (${formatFileSize(file.size)}). Processing may be slow.`);
  }

  return warnings.length > 0
    ? {
        valid: true,
        warning: warnings.join(" "),
      }
    : {
        valid: true,
      };
}

/**
 * Validate that an image's pixel dimensions are processable.
 * Needs decoded metadata, so callers run it after extracting dimensions.
 */
export function validateImageDimensions(
  metadata: Pick<ImageMetadata, "width" | "height">
): ValidationResult {
  if (metadata.width > MAX_PIXEL_DIMENSION || metadata.height > MAX_PIXEL_DIMENSION) {
    return {
      valid: false,
      error: `Image dimensions (${metadata.width}×${metadata.height}) exceed the maximum of ${MAX_PIXEL_DIMENSION}px per side`,
    };
  }

  if (metadata.width * metadata.height > MAX_TOTAL_PIXELS) {
    return {
      valid: false,
      error: `Image dimensions (${metadata.width}×${metadata.height}) exceed the maximum pixel budget of ${MAX_TOTAL_PIXELS.toLocaleString()} pixels`,
    };
  }

  return {
    valid: true,
  };
}

/** Validate draft resize targets before starting a potentially heavy encode. */
export function validateResizeOptions(
  metadata: Pick<ImageMetadata, "width" | "height">,
  resize: ResizeOptions | undefined
): ValidationResult {
  if (!resize) {
    return { valid: true };
  }

  const targets: Array<["Width" | "Height", number | undefined]> = [
    ["Width", resize.width],
    ["Height", resize.height],
  ];

  for (const [label, value] of targets) {
    if (value === undefined) continue;
    if (!Number.isFinite(value) || value < 1) {
      return { valid: false, error: `${label} must be at least 1px` };
    }
    if (value > MAX_PIXEL_DIMENSION) {
      return {
        valid: false,
        error: `${label} (${value}px) exceeds the maximum of ${MAX_PIXEL_DIMENSION}px per side`,
      };
    }
  }

  return validateImageDimensions(calculateDimensions(metadata.width, metadata.height, resize));
}

/**
 * Get file extension from format
 */
export function getFileExtension(format: ImageFormat): string {
  const extensionMap: Record<ImageFormat, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/avif": "avif",
    "image/heic": "heic",
    "image/heif": "heif",
  };

  return extensionMap[format] || "png";
}

/**
 * Generate download filename from original filename and format
 */
export function generateDownloadFilename(
  originalFilename: string,
  targetFormat: ImageFormat
): string {
  const extension = getFileExtension(targetFormat);
  const nameWithoutExtension = originalFilename.replace(/\.[^.]+$/, "");
  return `${nameWithoutExtension}-processed.${extension}`;
}
