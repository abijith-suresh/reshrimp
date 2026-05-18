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
 * Flip axis along which to mirror the image.
 */
export type FlipAxis = "horizontal" | "vertical";

/**
 * Crop region in source-image pixel coordinates.
 */
export interface CropRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Transform options applied before resize/format operations.
 */
export interface TransformOptions {
  rotation?: RotationDeg;
  flip?: FlipAxis;
}

/**
 * Image adjustment controls. Default values (1) produce no-op output.
 */
export interface ImageAdjustments {
  /** 0 = black, 1 = unchanged, 2 = twice as bright */
  brightness?: number;
  /** 0 = gray, 1 = unchanged, 2 = high contrast */
  contrast?: number;
  /** 0 = desaturated, 1 = unchanged, 2 = oversaturated */
  saturation?: number;
}

/**
 * Complete options for processing an image
 * Combines resize, format conversion, and compression
 */
export interface ProcessOptions {
  resize?: ResizeOptions;
  format?: ImageFormat;
  quality?: number;
  removeBackground?: boolean;
  transform?: TransformOptions;
  targetFileSize?: number;
  adjustments?: ImageAdjustments;
  crop?: CropRegion;
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
