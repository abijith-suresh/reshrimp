/**
 * Supported image formats for conversion
 */
export type ImageFormat = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';

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
 * Represents a processed image with original and processed states
 * Uses array structure for future batch processing support
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
 * Application state for image processing
 * Array-based design enables easy extension to batch processing
 */
export interface ImageState {
  images: ProcessedImage[];
  selectedIndex: number;
}

/**
 * Result of file validation
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
  warning?: string;
}
