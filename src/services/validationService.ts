import {
  MAX_FILE_SIZE,
  MAX_PIXEL_DIMENSION,
  MAX_TOTAL_PIXELS,
  RECOMMENDED_MAX_SIZE,
} from "../config/constants";
import { isAcceptedInputFormat } from "../config/imageFormats";
import type { ImageFormat, ImageMetadata, ValidationResult } from "../types/image";
import { formatFileSize } from "../utils/imageUtils";
import { isHeicBlob } from "./formatDetectionService";

export async function validateImageFile(file: File): Promise<ValidationResult> {
  // Some devices export HEIC files without an image MIME type.
  if (!file.type.startsWith("image/")) {
    if (!(await isHeicBlob(file))) {
      return {
        valid: false,
        error: "That file is not an image. Choose a JPEG, PNG, WebP, AVIF, or HEIC file.",
      };
    }
  } else if (!isAcceptedInputFormat(file.type)) {
    return {
      valid: false,
      error: "Reshrimp cannot open this kind of file. Use JPEG, PNG, WebP, AVIF, or HEIC.",
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `This file is ${formatFileSize(file.size)}. The limit is ${formatFileSize(MAX_FILE_SIZE)}. Choose a smaller file.`,
    };
  }

  return file.size > RECOMMENDED_MAX_SIZE
    ? {
        valid: true,
        warning: `This is a large file (${formatFileSize(file.size)}), so each change may take a few seconds.`,
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
      error: `This image is ${metadata.width} × ${metadata.height} px. Reshrimp opens images up to ${MAX_PIXEL_DIMENSION.toLocaleString()} px per side. Make it smaller in another app, then choose it again.`,
    };
  }

  if (metadata.width * metadata.height > MAX_TOTAL_PIXELS) {
    return {
      valid: false,
      error: `This image is ${metadata.width} × ${metadata.height} px (${Math.ceil((metadata.width * metadata.height) / 100_000) / 10} megapixels). Reshrimp opens images up to ${MAX_TOTAL_PIXELS / 1_000_000} megapixels. Make it smaller in another app, then choose it again.`,
    };
  }

  return {
    valid: true,
  };
}

export function generateDownloadFilename(
  originalFilename: string,
  targetFormat: ImageFormat
): string {
  const extensionMap: Record<ImageFormat, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/avif": "avif",
    "image/heic": "heic",
    "image/heif": "heif",
  };

  const extension = extensionMap[targetFormat];
  const nameWithoutExtension = originalFilename.replace(/\.[^.]+$/, "");
  return `${nameWithoutExtension}-processed.${extension}`;
}
