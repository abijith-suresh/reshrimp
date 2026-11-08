import type { ImageFormat } from "./image";

export type ResizeUnit = "px" | "%" | "in" | "cm";

export interface ResizeOptions {
  width?: number;
  height?: number;
  maintainAspectRatio: boolean;
}

export interface ProcessOptions {
  resize?: ResizeOptions;
  format?: ImageFormat;
  quality?: number; // 0-1 range for compression quality
  removeBackground?: boolean;
  /** Best-effort output ceiling in bytes for quality-adjustable formats. */
  targetFileSizeBytes?: number;
}

export type BackgroundRemovalProgressCallback = (progress: number) => void;

export interface ProcessResult {
  blob: Blob;
  /** The format requested by the workflow before browser capability fallback. */
  requestedFormat: ImageFormat;
  metadata: {
    width: number;
    height: number;
    format: ImageFormat;
    fileSize: number;
    targetFileSizeBytes?: number;
    targetFileSizeStatus?: "met" | "unmet" | "unsupported";
  };
}
