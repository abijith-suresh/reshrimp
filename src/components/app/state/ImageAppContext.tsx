import {
  createContext,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
  useContext,
  type JSX,
} from "solid-js";
import type { ProcessedImage, ValidationResult, ImageFormat } from "@/types/image";
import type { ProcessResult } from "@/types/processing";
import { preloadBackgroundRemoval } from "@/services/backgroundRemovalService";
import { revokeImageUrls } from "@/services/imageSessionService";
import { formatResizeValue } from "@/services/imageWorkflowService";
import { formatFileSize, convertFromPx } from "@/utils/imageUtils";
import { getInitialOutputFormat, supportsBrowserQualityControl } from "@/config/imageFormats";
import { createDebouncedTask, scheduleIdleTask } from "@/lib/asyncUtils";
import { useImageFormState } from "@/components/app/state/useImageFormState";
import { createProcessingPipeline } from "@/services/imageProcessingPipeline";
import type { AppState, AppActions, SizeDiff } from "@/components/app/state/appTypes";

export type { SizeDiff } from "@/components/app/state/appTypes";

const ImageAppContext = createContext<{ state: AppState; actions: AppActions }>();

export function ImageAppProvider(props: { children: JSX.Element }) {
  const [currentImage, setCurrentImage] = createSignal<ProcessedImage | null>(null);
  const [processResult, setProcessResult] = createSignal<ProcessResult | null>(null);
  const [isProcessing, setIsProcessing] = createSignal(false);
  const [progressLabel, setProgressLabel] = createSignal<string | null>(null);
  const [error, setError] = createSignal<string | null>(null);
  const [validation, setValidation] = createSignal<ValidationResult | null>(null);
  const [isDragOver, setIsDragOver] = createSignal(false);
  const [tooltipOpen, setTooltipOpen] = createSignal(false);
  const [dpiTooltipOpen, setDpiTooltipOpen] = createSignal(false);

  const form = useImageFormState(currentImage);

  const controlsActive = createMemo(() => currentImage() !== null);
  const formatSelectDisabled = createMemo(() => form.removeBackground());
  const downloadActive = createMemo(() => processResult() !== null);

  const currentOutputFormat = createMemo<ImageFormat | null>(() => {
    const image = currentImage();
    if (!image) return null;
    if (form.removeBackground()) return "image/png";
    return form.formatValue()
      ? (form.formatValue() as ImageFormat)
      : getInitialOutputFormat(image.metadata.format);
  });

  const qualityControlSupported = createMemo(() => {
    const format = currentOutputFormat();
    return format !== null && supportsBrowserQualityControl(format);
  });

  const widthPlaceholder = createMemo(() => {
    const img = currentImage();
    if (!img) return "Original";
    const px = img.metadata.width;
    const display = convertFromPx(px, form.resizeUnit(), px, form.dpiValue());
    return formatResizeValue(display, form.resizeUnit());
  });

  const heightPlaceholder = createMemo(() => {
    const img = currentImage();
    if (!img) return "Original";
    const px = img.metadata.height;
    const display = convertFromPx(px, form.resizeUnit(), px, form.dpiValue());
    return formatResizeValue(display, form.resizeUnit());
  });

  const sizeDifference = createMemo<SizeDiff | null>(() => {
    const img = currentImage();
    const result = processResult();
    if (!img || !result) return null;
    const diff = result.metadata.fileSize - img.metadata.fileSize;
    const pct = ((diff / img.metadata.fileSize) * 100).toFixed(1);
    const sign = diff > 0 ? "+" : "";
    return {
      text: `Change: ${sign}${formatFileSize(Math.abs(diff))} (${sign}${pct}%)`,
      className: diff > 0 ? "sp-text-increase" : "sp-text-decrease",
    };
  });

  const pipeline = createProcessingPipeline({
    currentImage,
    setCurrentImage,
    processResult,
    setProcessResult,
    isProcessing,
    setIsProcessing,
    setProgressLabel,
    setError,
    setValidation,
    setTooltipOpen,
    setDpiTooltipOpen,
    widthValue: form.widthValue,
    heightValue: form.heightValue,
    maintainAspectRatio: form.maintainAspectRatio,
    removeBackground: form.removeBackground,
    formatValue: form.formatValue,
    qualityValue: form.qualityValue,
    resizeUnit: form.resizeUnit,
    dpiValue: form.dpiValue,
    presetValue: form.presetValue,
    currentOutputFormat,
    qualityControlSupported,
    resetFormControls: form.resetFormControls,
  });

  const debouncedProcess = createDebouncedTask(() => {
    void pipeline.handleProcess();
  }, 400);

  pipeline.setupAutoProcessEffect(debouncedProcess);

  onCleanup(() => {
    debouncedProcess.cancel();
    revokeImageUrls(currentImage());
  });

  onMount(() => {
    const cancelIdleTask = scheduleIdleTask(() => {
      void preloadBackgroundRemoval().catch(() => {});
    });
    onCleanup(cancelIdleTask);
  });

  const state: AppState = {
    currentImage,
    processResult,
    isProcessing,
    progressLabel,
    error,
    validation,
    isDragOver,
    tooltipOpen,
    dpiTooltipOpen,
    widthValue: form.widthValue,
    heightValue: form.heightValue,
    maintainAspectRatio: form.maintainAspectRatio,
    removeBackground: form.removeBackground,
    formatValue: form.formatValue,
    previousFormatValue: form.previousFormatValue,
    qualityValue: form.qualityValue,
    resizeUnit: form.resizeUnit,
    dpiValue: form.dpiValue,
    presetValue: form.presetValue,
    currentOutputFormat,
    qualityControlSupported,
    controlsActive,
    formatSelectDisabled,
    downloadActive,
    widthPlaceholder,
    heightPlaceholder,
    sizeDifference,
  };

  const actions: AppActions = {
    handleFileUpload: pipeline.handleFileUpload,
    handleDownload: pipeline.handleDownload,
    handleRemoveBackgroundChange: form.handleRemoveBackgroundChange,
    handleUnitChange: form.handleUnitChange,
    handleDpiChange: form.handleDpiChange,
    handlePresetChange: form.handlePresetChange,
    handleWidthInput: form.handleWidthInput,
    handleHeightInput: form.handleHeightInput,
    handleAspectRatioChange: form.handleAspectRatioChange,
    setIsDragOver,
    setTooltipOpen,
    setDpiTooltipOpen,
    setFormatValue: form.setFormatValue,
    setQualityValue: form.setQualityValue,
  };

  return (
    <ImageAppContext.Provider value={{ state, actions }}>{props.children}</ImageAppContext.Provider>
  );
}

export function useImageApp() {
  const ctx = useContext(ImageAppContext);
  if (!ctx) {
    throw new Error("useImageApp must be used within an ImageAppProvider");
  }
  return ctx;
}
