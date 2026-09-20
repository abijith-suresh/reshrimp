import type { Accessor } from "solid-js";
import type { ImageFormat, ProcessedImage, ValidationResult } from "@/types/image";
import type { ProcessResult, ResizeUnit } from "@/types/processing";

export interface SizeDiff {
  text: string;
  className: string;
}

export interface AppState {
  currentImage: Accessor<ProcessedImage | null>;
  processResult: Accessor<ProcessResult | null>;
  isProcessing: Accessor<boolean>;
  progressLabel: Accessor<string | null>;
  statusMessage: Accessor<string | null>;
  error: Accessor<string | null>;
  resizeError: Accessor<string | null>;
  validation: Accessor<ValidationResult | null>;
  isDragOver: Accessor<boolean>;
  tooltipOpen: Accessor<boolean>;
  widthValue: Accessor<string>;
  heightValue: Accessor<string>;
  maintainAspectRatio: Accessor<boolean>;
  removeBackground: Accessor<boolean>;
  formatValue: Accessor<string>;
  previousFormatValue: Accessor<string>;
  qualityValue: Accessor<number>;
  resizeUnit: Accessor<ResizeUnit>;
  currentOutputFormat: Accessor<ImageFormat | null>;
  qualityControlSupported: Accessor<boolean>;
  controlsActive: Accessor<boolean>;
  formatSelectDisabled: Accessor<boolean>;
  downloadActive: Accessor<boolean>;
  hasPendingChanges: Accessor<boolean>;
  sizeDifference: Accessor<SizeDiff | null>;
  formatNotice: Accessor<string | null>;
}

export interface AppActions {
  handleFileUpload(file: File): Promise<void>;
  handleDownload(): void;
  handleRemoveBackgroundChange(checked: boolean): void;
  handleUnitChange(unit: ResizeUnit): void;
  handleWidthInput(val: string): void;
  handleHeightInput(val: string): void;
  handleAspectRatioChange(checked: boolean): void;
  applyChanges(): void;
  setIsDragOver(v: boolean): void;
  setTooltipOpen(v: boolean): void;
  handleFormatChange(v: string): void;
  handleQualityChange(v: number): void;
}

export interface ImageAppContextValue {
  state: AppState;
  actions: AppActions;
}
