/**
 * Supported image formats for conversion
 */
export type ImageFormat = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

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
  id: string;
  file: File;
  originalUrl: string;
  processedUrl: string | null;
  metadata: ImageMetadata;
  processing: boolean;
  error: string | null;
}

/**
 * Result of file validation
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
  warning?: string;
}
