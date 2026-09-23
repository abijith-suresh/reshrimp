import type { Accessor } from "solid-js";
import type { ImageFormat, ProcessedImage, ValidationResult } from "@/types/image";
import type { ProcessResult, ResizeUnit } from "@/types/processing";

export interface SizeDiff {
  text: string;
  className: string;
}

export type CompressionMode = "quality" | "size";

export interface AppState {
  currentImage: Accessor<ProcessedImage | null>;
  processResult: Accessor<ProcessResult | null>;
  lastCompletedResult: Accessor<ProcessResult | null>;
  isProcessing: Accessor<boolean>;
  progressLabel: Accessor<string | null>;
  error: Accessor<string | null>;
  validation: Accessor<ValidationResult | null>;
  isDragOver: Accessor<boolean>;
  widthValue: Accessor<string>;
  heightValue: Accessor<string>;
  maintainAspectRatio: Accessor<boolean>;
  removeBackground: Accessor<boolean>;
  formatValue: Accessor<string>;
  previousFormatValue: Accessor<string>;
  qualityValue: Accessor<number>;
  compressionMode: Accessor<CompressionMode>;
  targetFileSizeValue: Accessor<string>;
  targetFileSizeBytes: Accessor<number | null>;
  targetFileSizeInputInvalid: Accessor<boolean>;
  resizeUnit: Accessor<ResizeUnit>;
  dpiValue: Accessor<number>;
  currentOutputFormat: Accessor<ImageFormat | null>;
  qualityControlSupported: Accessor<boolean>;
  controlsActive: Accessor<boolean>;
  formatSelectDisabled: Accessor<boolean>;
  downloadActive: Accessor<boolean>;
  widthPlaceholder: Accessor<string>;
  heightPlaceholder: Accessor<string>;
  sizeDifference: Accessor<SizeDiff | null>;
  formatNotice: Accessor<string | null>;
  targetFileSizeNotice: Accessor<string | null>;
}

export interface AppActions {
  handleFileUpload(file: File): Promise<void>;
  handleDownload(): void;
  handleRemoveBackgroundChange(checked: boolean): void;
  handleUnitChange(unit: ResizeUnit): void;
  handleDpiChange(dpi: number): void;
  handleWidthInput(val: string): void;
  handleHeightInput(val: string): void;
  handleAspectRatioChange(checked: boolean): void;
  setIsDragOver(v: boolean): void;
  setFormatValue(v: string): void;
  setQualityValue(v: number): void;
  setCompressionMode(v: CompressionMode): void;
  setTargetFileSizeValue(v: string): void;
}

export interface ImageAppContextValue {
  state: AppState;
  actions: AppActions;
}
