/**
 * Supported image formats for conversion
 */
export type ImageFormat =
  "image/jpeg" | "image/png" | "image/webp" | "image/avif" | "image/heic" | "image/heif";

/**
 * Image metadata extracted from files
 */
export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  fileSize: number;
  fileName: string;
}

/**
 * Represents the active image session with original and processed states.
 */
export interface ProcessedImage {
  file: File;
  originalUrl: string;
  processedUrl: string | null;
  metadata: ImageMetadata;
}

/**
 * Result of file validation
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
  warning?: string;
}
