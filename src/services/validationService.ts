import {
  MAX_FILE_SIZE,
  MAX_PIXEL_DIMENSION,
  MAX_TOTAL_PIXELS,
  RECOMMENDED_MAX_SIZE,
} from "../config/constants";
import { getSupportedImageFormatSummary, isAcceptedInputFormat } from "../config/imageFormats";
import type { ImageFormat, ImageMetadata, ValidationResult } from "../types/image";
import { formatFileSize } from "../utils/imageUtils";
import { isHeicBlob } from "./formatDetectionService";

export async function validateImageFile(file: File): Promise<ValidationResult> {
  if (!file) {
    return {
      valid: false,
      error: "No file provided",
    };
  }

  // Some devices export HEIC files without an image MIME type.
  if (!file.type.startsWith("image/")) {
    if (!(await isHeicBlob(file))) {
      return {
        valid: false,
        error: "File must be an image",
      };
    }
  } else if (!isAcceptedInputFormat(file.type)) {
    return {
      valid: false,
      error: `Unsupported image format: ${file.type}. Supported formats: ${getSupportedImageFormatSummary()}`,
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size (${formatFileSize(file.size)}) exceeds maximum limit of ${formatFileSize(MAX_FILE_SIZE)}`,
    };
  }

  const warnings: string[] = [];

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

export function generateDownloadFilename(
  originalFilename: string,
  targetFormat: ImageFormat
): string {
  const extension = getFileExtension(targetFormat);
  const nameWithoutExtension = originalFilename.replace(/\.[^.]+$/, "");
  return `${nameWithoutExtension}-processed.${extension}`;
}
