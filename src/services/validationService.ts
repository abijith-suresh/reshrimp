import {
  ACCEPTED_INPUT_FORMATS,
  getSupportedImageFormatSummary,
  isAcceptedInputFormat,
} from "../config/imageFormats";
import { MAX_FILE_SIZE, RECOMMENDED_MAX_SIZE } from "../config/constants";
import type { ImageFormat, ValidationResult } from "../types/image";
import { formatFileSize } from "../utils/imageUtils";

/**
 * Get list of supported image formats
 */
export function getSupportedFormats(): ImageFormat[] {
  return [...ACCEPTED_INPUT_FORMATS];
}

/**
 * Check if a MIME type is a supported image format
 */
export function isSupportedFormat(mimeType: string): boolean {
  return ACCEPTED_INPUT_FORMATS.includes(mimeType as ImageFormat);
}

/**
 * Validate an image file for processing
 * Returns validation result with error or warning messages
 */
export function validateImageFile(file: File): ValidationResult {
  // Check if file exists
  if (!file) {
    return {
      valid: false,
      error: "No file provided",
    };
  }

  // Check if it's an image file
  if (!file.type.startsWith("image/")) {
    return {
      valid: false,
      error: "File must be an image",
    };
  }

  // Check if format is supported (including HEIC/HEIF/AVIF)
  if (!isAcceptedInputFormat(file.type)) {
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
