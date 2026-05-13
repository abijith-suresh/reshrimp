import {
  batch,
  createContext,
  createEffect,
  createMemo,
  createSignal,
  on,
  onCleanup,
  onMount,
  useContext,
  type Accessor,
  type JSX,
} from "solid-js";
import type { ProcessedImage, ValidationResult, ImageFormat } from "@/types/image";
import type { ProcessResult, ResizeUnit } from "@/types/processing";
import { processImage, getImageMetadata } from "@/services/imageService";
import { preloadBackgroundRemoval } from "@/services/backgroundRemovalService";
import {
  downloadProcessedBlob,
  replaceObjectUrl,
  revokeImageUrls,
} from "@/services/imageSessionService";
import {
  buildProcessOptions,
  formatResizeValue,
  getDimensionValuesForDpiChange,
  getFormatStateForBackgroundRemoval,
  getLinkedDimensionValues,
  getPresetResizeValues,
  rebaseDimensionValues,
} from "@/services/imageWorkflowService";
import { validateImageFile, generateDownloadFilename } from "@/services/validationService";
import { formatFileSize, generateId, convertFromPx } from "@/utils/imageUtils";
import { DEFAULT_DPI } from "@/config/constants";
import {
  getInitialOutputFormat,
  getQualityControlNotice,
  supportsBrowserQualityControl,
} from "@/config/imageFormats";
import { SOCIAL_MEDIA_PRESETS } from "@/config/presets";

export interface SizeDiff {
  text: string;
  className: string;
}

function createDebouncedTask(fn: () => void, ms: number) {
  let timer: ReturnType<typeof setTimeout> | undefined;

  return {
    run() {
      if (timer !== undefined) clearTimeout(timer);
      timer = setTimeout(fn, ms);
    },
    cancel() {
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
    },
  };
}

function scheduleIdleTask(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const idleWindow = window as Window & {
    requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
    cancelIdleCallback?: (handle: number) => void;
  };

  if (
    typeof idleWindow.requestIdleCallback === "function" &&
    typeof idleWindow.cancelIdleCallback === "function"
  ) {
    const id = idleWindow.requestIdleCallback(() => callback(), { timeout: 1500 });
    return () => idleWindow.cancelIdleCallback?.(id);
  }

  const id = globalThis.setTimeout(callback, 300);
  return () => globalThis.clearTimeout(id);
}

interface AppState {
  currentImage: Accessor<ProcessedImage | null>;
  processResult: Accessor<ProcessResult | null>;
  isProcessing: Accessor<boolean>;
  progressLabel: Accessor<string | null>;
  error: Accessor<string | null>;
  validation: Accessor<ValidationResult | null>;
  isDragOver: Accessor<boolean>;
  tooltipOpen: Accessor<boolean>;
  dpiTooltipOpen: Accessor<boolean>;
  widthValue: Accessor<string>;
  heightValue: Accessor<string>;
  maintainAspectRatio: Accessor<boolean>;
  removeBackground: Accessor<boolean>;
  formatValue: Accessor<string>;
  previousFormatValue: Accessor<string>;
  qualityValue: Accessor<number>;
  resizeUnit: Accessor<ResizeUnit>;
  dpiValue: Accessor<number>;
  presetValue: Accessor<string>;
  currentOutputFormat: Accessor<ImageFormat | null>;
  qualityControlSupported: Accessor<boolean>;
  qualityControlNotice: Accessor<string | null>;
  controlsActive: Accessor<boolean>;
  formatSelectDisabled: Accessor<boolean>;
  downloadActive: Accessor<boolean>;
  widthPlaceholder: Accessor<string>;
  heightPlaceholder: Accessor<string>;
  sizeDifference: Accessor<SizeDiff | null>;
}

interface AppActions {
  handleFileUpload(file: File): Promise<void>;
  handleDownload(): void;
  handleRemoveBackgroundChange(checked: boolean): void;
  handleUnitChange(unit: ResizeUnit): void;
  handleDpiChange(dpi: number): void;
  handlePresetChange(label: string): void;
  handleWidthInput(val: string): void;
  handleHeightInput(val: string): void;
  handleAspectRatioChange(checked: boolean): void;
  setIsDragOver(v: boolean): void;
  setTooltipOpen(v: boolean): void;
  setDpiTooltipOpen(v: boolean): void;
  setFormatValue(v: string): void;
  setQualityValue(v: number): void;
}

const ImageAppContext = createContext<{ state: AppState; actions: AppActions }>();

export function ImageAppProvider(props: { children: JSX.Element }) {
  // ── Core image state ──────────────────────────────────────────────────────
  const [currentImage, setCurrentImage] = createSignal<ProcessedImage | null>(null);
  const [processResult, setProcessResult] = createSignal<ProcessResult | null>(null);

  // ── Async / loading state ─────────────────────────────────────────────────
  const [isProcessing, setIsProcessing] = createSignal(false);
  const [progressLabel, setProgressLabel] = createSignal<string | null>(null);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [error, setError] = createSignal<string | null>(null);
  const [validation, setValidation] = createSignal<ValidationResult | null>(null);
  const [isDragOver, setIsDragOver] = createSignal(false);
  const [tooltipOpen, setTooltipOpen] = createSignal(false);
  const [dpiTooltipOpen, setDpiTooltipOpen] = createSignal(false);

  // ── Form controls ─────────────────────────────────────────────────────────
  const [widthValue, setWidthValue] = createSignal("");
  const [heightValue, setHeightValue] = createSignal("");
  const [maintainAspectRatio, setMaintainAspectRatio] = createSignal(true);
  const [removeBackground, setRemoveBackground] = createSignal(false);
  const [formatValue, setFormatValue] = createSignal("");
  const [previousFormatValue, setPreviousFormatValue] = createSignal("");
  const [qualityValue, setQualityValue] = createSignal(92);

  // ── Resize unit controls ──────────────────────────────────────────────────
  const [resizeUnit, setResizeUnit] = createSignal<ResizeUnit>("px");
  const [dpiValue, setDpiValue] = createSignal(DEFAULT_DPI);
  const [presetValue, setPresetValue] = createSignal("");

  const debouncedProcess = createDebouncedTask(() => {
    void handleProcess();
  }, 400);

  onCleanup(() => {
    debouncedProcess.cancel();
    revokeImageUrls(currentImage());
  });

  // ── Preload background removal WASM + model once the app is idle ─────────
  onMount(() => {
    const cancelIdleTask = scheduleIdleTask(() => {
      void preloadBackgroundRemoval().catch(() => {
        // Silently ignore preload failures — will retry on actual use.
      });
    });

    onCleanup(cancelIdleTask);
  });

  // ── Derived signals ───────────────────────────────────────────────────────
  const controlsActive = createMemo(() => currentImage() !== null);
  const formatSelectDisabled = createMemo(() => removeBackground());
  const downloadActive = createMemo(() => processResult() !== null);

  const currentOutputFormat = createMemo<ImageFormat | null>(() => {
    const image = currentImage();
    if (!image) return null;
    if (removeBackground()) return "image/png";
    return formatValue()
      ? (formatValue() as ImageFormat)
      : getInitialOutputFormat(image.metadata.format);
  });

  const qualityControlSupported = createMemo(() => {
    const format = currentOutputFormat();
    return format !== null && supportsBrowserQualityControl(format);
  });

  const qualityControlNotice = createMemo(() => {
    const format = currentOutputFormat();
    return format ? getQualityControlNotice(format) : null;
  });

  const widthPlaceholder = createMemo(() => {
    const img = currentImage();
    if (!img) return "Original";
    const px = img.metadata.width;
    const display = convertFromPx(px, resizeUnit(), px, dpiValue());
    return formatResizeValue(display, resizeUnit());
  });

  const heightPlaceholder = createMemo(() => {
    const img = currentImage();
    if (!img) return "Original";
    const px = img.metadata.height;
    const display = convertFromPx(px, resizeUnit(), px, dpiValue());
    return formatResizeValue(display, resizeUnit());
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

  // ── Core processing (internal) ────────────────────────────────────────────
  async function handleProcess(): Promise<void> {
    const img = currentImage();
    if (!img || isProcessing()) return;

    const options = buildProcessOptions({
      originalWidth: img.metadata.width,
      originalHeight: img.metadata.height,
      widthValue: widthValue(),
      heightValue: heightValue(),
      maintainAspectRatio: maintainAspectRatio(),
      removeBackground: removeBackground(),
      formatValue: formatValue(),
      qualityValue: qualityValue(),
      resizeUnit: resizeUnit(),
      dpi: dpiValue(),
    });

    setIsProcessing(true);
    setError(null);

    if (options.removeBackground) {
      setProgressLabel("Removing background\u2026");
    }

    try {
      const result = await processImage(
        img.file,
        options,
        options.removeBackground
          ? (progress: number) => {
              const pct = Math.round(progress * 100);
              setProgressLabel(`Removing background ${pct}%\u2026`);
            }
          : undefined
      );

      const processedUrl = replaceObjectUrl(img.processedUrl, result.blob);

      // Batch result updates into a single DOM update
      batch(() => {
        setCurrentImage((prev) => (prev ? { ...prev, processedUrl } : null));
        setProcessResult(result);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Processing failed");
      console.error("Error processing image:", err);
    } finally {
      batch(() => {
        setIsProcessing(false);
        setProgressLabel(null);
      });
    }
  }

  // ── Auto-process: debounce fast operations, immediate for bg removal ──────
  createEffect(
    on(
      [
        currentImage,
        widthValue,
        heightValue,
        formatValue,
        () => (qualityControlSupported() ? qualityValue() : null),
        resizeUnit,
        dpiValue,
        presetValue,
        maintainAspectRatio,
        removeBackground,
      ],
      ([image, , , , , , , , , shouldRemoveBackground]) => {
        if (!image) return;

        if (shouldRemoveBackground) {
          void handleProcess();
          return;
        }

        debouncedProcess.run();
      },
      { defer: true }
    )
  );

  // ── Handlers ──────────────────────────────────────────────────────────────
  async function handleFileUpload(file: File): Promise<void> {
    const validationResult = validateImageFile(file);
    setValidation(validationResult);

    if (!validationResult.valid) return;

    try {
      const metadata = await getImageMetadata(file);
      const originalUrl = URL.createObjectURL(file);

      const processedImage: ProcessedImage = {
        id: generateId(),
        file,
        originalUrl,
        processedUrl: null,
        metadata,
        processing: false,
        error: null,
      };

      // Batch all state resets into a single DOM update to prevent flickering.
      // Without batch(), each set* after an await triggers a separate re-render.
      batch(() => {
        // Reset stale state when a new file is loaded
        setCurrentImage((previousImage) => {
          revokeImageUrls(previousImage);
          return processedImage;
        });
        setProcessResult(null);
        setError(null);

        // Reset form controls to defaults
        setWidthValue("");
        setHeightValue("");
        setMaintainAspectRatio(true);
        setRemoveBackground(false);
        setFormatValue(getInitialOutputFormat(metadata.format));
        setPreviousFormatValue("");
        setQualityValue(92);
        setTooltipOpen(false);

        // Reset unit controls
        setResizeUnit("px");
        setDpiValue(DEFAULT_DPI);
        setPresetValue("");
        setDpiTooltipOpen(false);
      });
    } catch (err) {
      setError("Failed to load image. Please try another file.");
      console.error("Error loading image:", err);
    }
  }

  function handleDownload(): void {
    const img = currentImage();
    const result = processResult();
    if (!img?.processedUrl || !result) return;

    const targetFormat = currentOutputFormat();
    if (!targetFormat) return;

    const filename = generateDownloadFilename(img.metadata.fileName, targetFormat);

    try {
      downloadProcessedBlob(result.blob, filename);
    } catch (err) {
      setError("Failed to download image");
      console.error("Download error:", err);
    }
  }

  function handleRemoveBackgroundChange(checked: boolean): void {
    const nextFormatState = getFormatStateForBackgroundRemoval({
      checked,
      formatValue: formatValue(),
      previousFormatValue: previousFormatValue(),
    });

    setPreviousFormatValue(nextFormatState.previousFormatValue);
    setFormatValue(nextFormatState.formatValue);
    setRemoveBackground(checked);
  }

  function handleUnitChange(newUnit: ResizeUnit): void {
    const img = currentImage();

    if (img) {
      const nextDimensions = rebaseDimensionValues({
        widthValue: widthValue(),
        heightValue: heightValue(),
        oldUnit: resizeUnit(),
        newUnit,
        originalWidth: img.metadata.width,
        originalHeight: img.metadata.height,
        dpi: dpiValue(),
      });

      setWidthValue(nextDimensions.widthValue);
      setHeightValue(nextDimensions.heightValue);
    }

    setResizeUnit(newUnit);
  }

  function handleDpiChange(newDpi: number): void {
    const img = currentImage();

    if (img) {
      const nextDimensions = getDimensionValuesForDpiChange({
        widthValue: widthValue(),
        heightValue: heightValue(),
        resizeUnit: resizeUnit(),
        originalWidth: img.metadata.width,
        originalHeight: img.metadata.height,
        previousDpi: dpiValue(),
        nextDpi: newDpi,
      });

      setWidthValue(nextDimensions.widthValue);
      setHeightValue(nextDimensions.heightValue);
    }

    setDpiValue(newDpi);
  }

  function handlePresetChange(label: string): void {
    setPresetValue(label);
    if (!label) return;

    const presetValues = getPresetResizeValues(label, SOCIAL_MEDIA_PRESETS);
    if (!presetValues) return;

    setResizeUnit(presetValues.resizeUnit);
    setWidthValue(presetValues.widthValue);
    setHeightValue(presetValues.heightValue);
  }

  function handleWidthInput(val: string): void {
    setPresetValue("");

    if (!maintainAspectRatio()) {
      setWidthValue(val);
      return;
    }

    const img = currentImage();
    if (!img) {
      setWidthValue(val);
      return;
    }

    const linkedDimensions = getLinkedDimensionValues({
      changedDimension: "width",
      value: val,
      resizeUnit: resizeUnit(),
      dpi: dpiValue(),
      originalWidth: img.metadata.width,
      originalHeight: img.metadata.height,
    });

    if (!linkedDimensions) {
      setWidthValue(val);
      return;
    }

    setWidthValue(linkedDimensions.widthValue);
    setHeightValue(linkedDimensions.heightValue);
  }

  function handleHeightInput(val: string): void {
    setPresetValue("");

    if (!maintainAspectRatio()) {
      setHeightValue(val);
      return;
    }

    const img = currentImage();
    if (!img) {
      setHeightValue(val);
      return;
    }

    const linkedDimensions = getLinkedDimensionValues({
      changedDimension: "height",
      value: val,
      resizeUnit: resizeUnit(),
      dpi: dpiValue(),
      originalWidth: img.metadata.width,
      originalHeight: img.metadata.height,
    });

    if (!linkedDimensions) {
      setHeightValue(val);
      return;
    }

    setWidthValue(linkedDimensions.widthValue);
    setHeightValue(linkedDimensions.heightValue);
  }

  function handleAspectRatioChange(checked: boolean): void {
    setMaintainAspectRatio(checked);
    if (checked) {
      if (widthValue()) {
        handleWidthInput(widthValue());
      } else if (heightValue()) {
        handleHeightInput(heightValue());
      }
    }
  }

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
    widthValue,
    heightValue,
    maintainAspectRatio,
    removeBackground,
    formatValue,
    previousFormatValue,
    qualityValue,
    resizeUnit,
    dpiValue,
    presetValue,
    currentOutputFormat,
    qualityControlSupported,
    qualityControlNotice,
    controlsActive,
    formatSelectDisabled,
    downloadActive,
    widthPlaceholder,
    heightPlaceholder,
    sizeDifference,
  };

  const actions: AppActions = {
    handleFileUpload,
    handleDownload,
    handleRemoveBackgroundChange,
    handleUnitChange,
    handleDpiChange,
    handlePresetChange,
    handleWidthInput,
    handleHeightInput,
    handleAspectRatioChange,
    setIsDragOver,
    setTooltipOpen,
    setDpiTooltipOpen,
    setFormatValue,
    setQualityValue,
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
