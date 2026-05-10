import type { ImageFormat } from "./image";

/**
 * Supported resize units
 */
export type ResizeUnit = "px" | "%" | "in" | "cm";

/**
 * Options for resizing images
 */
export interface ResizeOptions {
  width?: number;
  height?: number;
  maintainAspectRatio: boolean;
}

/**
 * Rotation angle in degrees (clockwise).
 */
export type RotationDeg = 90 | 180 | 270;

/**
 * Axis along which to mirror the image.
 */
export type FlipAxis = "horizontal" | "vertical";

/**
 * Transform options applied before resize/format operations.
 */
export interface TransformOptions {
  rotation?: RotationDeg;
  flip?: FlipAxis;
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
  transform?: TransformOptions;
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
