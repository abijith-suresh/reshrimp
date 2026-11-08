export type ImageFormat =
  | "image/jpeg"
  | "image/png"
  | "image/webp"
  | "image/avif"
  | "image/heic"
  | "image/heif";

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  fileSize: number;
  fileName: string;
}

export interface ProcessedImage {
  file: File;
  originalUrl: string;
  processedUrl: string | null;
  metadata: ImageMetadata;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  warning?: string;
}
