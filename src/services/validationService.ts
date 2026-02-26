import type { ImageFormat, ValidationResult } from "../types/image";
import { MAX_FILE_SIZE, RECOMMENDED_MAX_SIZE } from "../config/constants";
import { formatFileSize } from "../utils/imageUtils";

/**
 * Get list of supported image formats
 */
export function getSupportedFormats(): ImageFormat[] {
  return ["image/jpeg", "image/png", "image/webp", "image/gif"];
}

/**
 * Check if a MIME type is a supported image format
 */
export function isSupportedFormat(mimeType: string): boolean {
  return getSupportedFormats().includes(mimeType as ImageFormat);
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

  // Check if format is supported
  if (!isSupportedFormat(file.type)) {
    return {
      valid: false,
      error: `Unsupported image format: ${file.type}. Supported formats: JPEG, PNG, WebP, GIF`,
    };
  }

  // Check if file is too large (hard limit)
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size (${formatFileSize(file.size)}) exceeds maximum limit of ${formatFileSize(MAX_FILE_SIZE)}`,
    };
  }

  // Warn if file is large but still processable
  if (file.size > RECOMMENDED_MAX_SIZE) {
    return {
      valid: true,
      warning: `Large file detected (${formatFileSize(file.size)}). Processing may be slow.`,
    };
  }

  return {
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
    "image/gif": "gif",
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
