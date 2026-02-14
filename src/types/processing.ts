import type { ImageFormat } from './image';

/**
 * Options for resizing images
 */
export interface ResizeOptions {
  width?: number;
  height?: number;
  maintainAspectRatio: boolean;
}

/**
 * Complete options for processing an image
 * Combines resize, format conversion, and compression
 */
export interface ProcessOptions {
  resize?: ResizeOptions;
  format?: ImageFormat;
  quality?: number; // 0-1 range for compression quality
  removeBackground?: boolean;
}

/**
 * Progress callback for background removal operations
 */
export type BackgroundRemovalProgressCallback = (progress: number) => void;

/**
 * Result of image processing operation
 */
export interface ProcessResult {
  blob: Blob;
  metadata: {
    width: number;
    height: number;
    format: string;
    fileSize: number;
  };
}
