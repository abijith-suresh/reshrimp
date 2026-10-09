import {
  batch,
  createContext,
  createEffect,
  createMemo,
  createSignal,
  type JSX,
  on,
  onCleanup,
  onMount,
  useContext,
} from "solid-js";
import { DEFAULT_DPI } from "@/config/constants";
import {
  getImageFormatLabel,
  getInitialOutputFormat,
  supportsBrowserQualityControl,
} from "@/config/imageFormats";
import { preloadBackgroundRemoval } from "@/services/backgroundRemovalService";
import { getImageMetadata, prepareImageFile, processImage } from "@/services/imageService";
import {
  buildProcessOptions,
  formatResizeValue,
  getDimensionValuesForDpiChange,
  getFormatStateForBackgroundRemoval,
  getLinkedDimensionValues,
  parseTargetFileSizeKilobytes,
  rebaseDimensionValues,
} from "@/services/imageWorkflowService";
import {
  generateDownloadFilename,
  validateImageDimensions,
  validateImageFile,
} from "@/services/validationService";
import type { ImageFormat, ProcessedImage, ValidationResult } from "@/types/image";
import type { ProcessResult, ResizeUnit } from "@/types/processing";
import { convertFromPx, createDownloadLink, formatFileSize } from "@/utils/imageUtils";
import {
  createDecodedObjectUrl,
  revokeImageSessionUrls,
  revokeProcessedObjectUrl,
} from "./imageAppObjectUrls";
import type {
  AppActions,
  AppState,
  CompressionMode,
  ImageAppContextValue,
  SizeDiff,
} from "./imageAppTypes";

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

type NetworkInformation = {
  saveData?: boolean;
  effectiveType?: string;
  downlink?: number;
};

type IdleWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};

const PRELOAD_FALLBACK_DELAY_MS = 2000;

function scheduleBackgroundRemovalPreload(callback: () => void): () => void {
  const network = (navigator as Navigator & { connection?: NetworkInformation }).connection;
  // Skip automatic model downloads on slow connections or when data saving is enabled.
  if (
    network?.saveData ||
    (network?.effectiveType !== undefined && network.effectiveType !== "4g") ||
    (network?.downlink !== undefined && network.downlink < 8)
  ) {
    return () => {};
  }

  const idleWindow = window as IdleWindow;
  if (idleWindow.requestIdleCallback) {
    const handle = idleWindow.requestIdleCallback(callback, {
      timeout: PRELOAD_FALLBACK_DELAY_MS,
    });
    return () => idleWindow.cancelIdleCallback?.(handle);
  }

  const timeout = window.setTimeout(callback, PRELOAD_FALLBACK_DELAY_MS);
  return () => window.clearTimeout(timeout);
}

const ImageAppContext = createContext<ImageAppContextValue>();

export function ImageAppProvider(props: { children: JSX.Element }) {
  const [currentImage, setCurrentImage] = createSignal<ProcessedImage | null>(null);
  const [processResult, setProcessResult] = createSignal<ProcessResult | null>(null);
  const [lastCompletedResult, setLastCompletedResult] = createSignal<ProcessResult | null>(null);

  // Only uploads change this ID. Preview updates must not start another run.
  const [sessionId, setSessionId] = createSignal(0);

  // This run ID prevents old results from changing the active session.
  let activeRunSession: number | null = null;
  let activeRunId: number | null = null;
  let pendingPreviewAbort: AbortController | null = null;
  let nextRunId = 0;
  let uploadRequestId = 0;
  let disposed = false;
  let processingRevision = 0;
  // Process edits made during an active run after that run completes.
  let pendingReprocess = false;
  let preloadRequested = false;
  let cancelScheduledPreload: (() => void) | undefined;

  const [isProcessing, setIsProcessing] = createSignal(false);
  const [progressLabel, setProgressLabel] = createSignal<string | null>(null);

  const [error, setError] = createSignal<string | null>(null);
  const [validation, setValidation] = createSignal<ValidationResult | null>(null);
  const [isDragOver, setIsDragOver] = createSignal(false);

  const [widthValue, setWidthValue] = createSignal("");
  const [heightValue, setHeightValue] = createSignal("");
  const [maintainAspectRatio, setMaintainAspectRatio] = createSignal(true);
  const [removeBackground, setRemoveBackground] = createSignal(false);
  const [formatValue, setFormatValue] = createSignal("");
  const [previousFormatValue, setPreviousFormatValue] = createSignal("");
  const [qualityValue, setQualityValue] = createSignal(92);
  const [compressionMode, setCompressionMode] = createSignal<CompressionMode>("quality");
  const [targetFileSizeValue, setTargetFileSizeValue] = createSignal("");

  const [resizeUnit, setResizeUnit] = createSignal<ResizeUnit>("px");
  const [dpiValue, setDpiValue] = createSignal(DEFAULT_DPI);

  const debouncedProcess = createDebouncedTask(() => {
    void handleProcess();
  }, 400);

  onCleanup(() => {
    disposed = true;
    cancelScheduledPreload?.();
    cancelScheduledPreload = undefined;
    debouncedProcess.cancel();
    pendingPreviewAbort?.abort();
    pendingPreviewAbort = null;
    revokeImageSessionUrls(currentImage());
  });

  function warmBackgroundRemoval(): void {
    if (preloadRequested) return;
    preloadRequested = true;
    cancelScheduledPreload?.();
    cancelScheduledPreload = undefined;
    void preloadBackgroundRemoval().catch(() => {
      // The processing path can retry with a fresh library initialization key.
      preloadRequested = false;
    });
  }

  onMount(() => {
    cancelScheduledPreload = scheduleBackgroundRemovalPreload(warmBackgroundRemoval);
  });

  const controlsActive = createMemo(() => currentImage() !== null);
  const formatSelectDisabled = createMemo(() => removeBackground());
  const downloadActive = createMemo(
    () => processResult() !== null && currentImage()?.processedUrl !== null
  );

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

  const targetFileSizeBytes = createMemo(() => {
    if (!qualityControlSupported() || compressionMode() !== "size") return null;
    return parseTargetFileSizeKilobytes(targetFileSizeValue());
  });

  const targetFileSizeInputInvalid = createMemo(() => {
    const value = targetFileSizeValue().trim();
    return (
      compressionMode() === "size" &&
      qualityControlSupported() &&
      value !== "" &&
      targetFileSizeBytes() === null
    );
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
    const result = lastCompletedResult();
    if (!img || !result) return null;
    const diff = result.metadata.fileSize - img.metadata.fileSize;
    const pct = ((diff / img.metadata.fileSize) * 100).toFixed(1);
    const sign = diff > 0 ? "+" : "";
    return {
      text: `Change: ${sign}${formatFileSize(Math.abs(diff))} (${sign}${pct}%)`,
      className: diff > 0 ? "font-medium text-coral-500" : "font-medium text-mint-600",
    };
  });

  const formatNotice = createMemo<string | null>(() => {
    const result = processResult();
    if (!result) return null;

    const requestedFormat = result.requestedFormat;
    if (requestedFormat === result.metadata.format) return null;

    return `Your browser could not export ${getImageFormatLabel(requestedFormat)}. Downloaded as ${getImageFormatLabel(result.metadata.format)} instead.`;
  });

  const targetFileSizeNotice = createMemo<string | null>(() => {
    const metadata = processResult()?.metadata;
    if (!metadata) return null;
    const targetBytes = metadata.targetFileSizeBytes;
    const status = metadata.targetFileSizeStatus;
    if (targetBytes === undefined || status === undefined) return null;

    if (status === "met") {
      return `Output fits within ${formatFileSize(targetBytes)}.`;
    }
    if (status === "unmet") {
      return `Could not meet ${formatFileSize(targetBytes)}. Smallest result: ${formatFileSize(metadata.fileSize)}.`;
    }
    return "This browser could not apply a size target to the output format.";
  });

  async function handleProcess(): Promise<void> {
    if (disposed) return;

    const img = currentImage();
    if (!img) return;

    if (activeRunSession !== null) {
      pendingReprocess = true;
      return;
    }

    const session = sessionId();
    const runId = ++nextRunId;
    const runRevision = processingRevision;

    const options = buildProcessOptions({
      originalWidth: img.metadata.width,
      originalHeight: img.metadata.height,
      widthValue: widthValue(),
      heightValue: heightValue(),
      maintainAspectRatio: maintainAspectRatio(),
      removeBackground: removeBackground(),
      formatValue: formatValue(),
      qualityValue: qualityValue(),
      targetFileSizeBytes: targetFileSizeBytes() ?? undefined,
      resizeUnit: resizeUnit(),
      dpi: dpiValue(),
    });

    activeRunSession = session;
    activeRunId = runId;

    const isCurrentRun = () =>
      !disposed &&
      activeRunSession === session &&
      activeRunId === runId &&
      sessionId() === session &&
      processingRevision === runRevision;

    batch(() => {
      setProcessResult(null);
      setIsProcessing(true);
      setProgressLabel("Updating preview\u2026");
      setError(null);
    });

    if (options.removeBackground) {
      setProgressLabel("Removing background\u2026");
    } else if (options.targetFileSizeBytes !== undefined) {
      setProgressLabel("Adjusting quality for size target\u2026");
    }

    let previewAbortController: AbortController | null = null;

    try {
      const result = await processImage(
        img.file,
        options,
        options.removeBackground
          ? (progress: number) => {
              if (!isCurrentRun()) return;
              const pct = Math.round(progress * 100);
              setProgressLabel(`Removing background ${pct}%\u2026`);
            }
          : undefined
      );

      // Discard results from an earlier image session.
      if (!isCurrentRun()) return;

      // Keep the current preview until the new output is fully decoded.
      previewAbortController = new AbortController();
      pendingPreviewAbort = previewAbortController;
      const processedUrl = await createDecodedObjectUrl(result.blob, previewAbortController.signal);

      // Recheck the session and inputs after decoding.
      if (!isCurrentRun()) {
        revokeProcessedObjectUrl(processedUrl);
        return;
      }

      const previousProcessedUrl = img.processedUrl;

      batch(() => {
        setCurrentImage((prev) => (prev ? { ...prev, processedUrl } : null));
        setProcessResult(result);
        setLastCompletedResult(result);
      });
      revokeProcessedObjectUrl(previousProcessedUrl);
    } catch (err) {
      if (isCurrentRun()) {
        setError(err instanceof Error ? err.message : "Processing failed");
        console.error("Error processing image:", err);
      }
    } finally {
      if (pendingPreviewAbort === previewAbortController) {
        pendingPreviewAbort = null;
      }
      const ownsRun = activeRunSession === session && activeRunId === runId;
      if (ownsRun) activeRunSession = null;
      if (ownsRun) activeRunId = null;
      if (ownsRun && !disposed) {
        batch(() => {
          setIsProcessing(false);
          setProgressLabel(null);
        });
        if (pendingReprocess) {
          pendingReprocess = false;
          debouncedProcess.run();
        }
      }
    }
  }

  // Track the session ID and inputs. Preview updates must not start another run.
  createEffect(
    on(
      [
        sessionId,
        widthValue,
        heightValue,
        formatValue,
        compressionMode,
        () =>
          qualityControlSupported() && compressionMode() === "quality" ? qualityValue() : null,
        () =>
          qualityControlSupported() && compressionMode() === "size" ? targetFileSizeValue() : null,
        resizeUnit,
        dpiValue,
        maintainAspectRatio,
        removeBackground,
      ],
      () => {
        const img = currentImage();
        if (!img) return;

        processingRevision += 1;

        pendingPreviewAbort?.abort();
        pendingPreviewAbort = null;
        setProcessResult(null);

        if (targetFileSizeInputInvalid()) {
          debouncedProcess.cancel();
          return;
        }

        if (compressionMode() === "size" && !targetFileSizeValue().trim()) {
          debouncedProcess.cancel();
          return;
        }

        if (removeBackground()) {
          void handleProcess();
          return;
        }

        debouncedProcess.run();
      },
      { defer: true }
    )
  );

  async function handleFileUpload(file: File): Promise<void> {
    const requestId = ++uploadRequestId;

    try {
      const validationResult = await validateImageFile(file);
      if (disposed || requestId !== uploadRequestId) return;
      setValidation(validationResult);

      if (!validationResult.valid) return;

      const preparedImage = await prepareImageFile(file);
      if (disposed || requestId !== uploadRequestId) return;

      const metadata =
        preparedImage.format === preparedImage.file.type
          ? await getImageMetadata(preparedImage.file)
          : await getImageMetadata(preparedImage.file, preparedImage.format);
      if (disposed || requestId !== uploadRequestId) return;

      const sourceMetadata = {
        ...metadata,
        fileSize: file.size,
        fileName: file.name,
      };

      const dimensionResult = validateImageDimensions(sourceMetadata);
      if (!dimensionResult.valid) {
        setValidation(dimensionResult);
        return;
      }

      const originalUrl = URL.createObjectURL(preparedImage.file);
      if (disposed || requestId !== uploadRequestId) {
        URL.revokeObjectURL(originalUrl);
        return;
      }

      const processedImage: ProcessedImage = {
        file: preparedImage.file,
        originalUrl,
        processedUrl: null,
        metadata: sourceMetadata,
      };

      // Apply all upload state changes in one DOM update.
      batch(() => {
        // The new image must not wait for the previous run.
        activeRunSession = null;
        activeRunId = null;
        pendingPreviewAbort?.abort();
        pendingPreviewAbort = null;
        debouncedProcess.cancel();
        setIsProcessing(false);
        setCurrentImage((previousImage) => {
          revokeImageSessionUrls(previousImage);
          return processedImage;
        });
        // The new session starts its own processing run.
        pendingReprocess = false;
        setSessionId((id) => id + 1);
        setProcessResult(null);
        setLastCompletedResult(null);
        setError(null);
        setProgressLabel(null);
        setTargetFileSizeValue("");

        setWidthValue(String(metadata.width));
        setHeightValue(String(metadata.height));
        setMaintainAspectRatio(true);
        setRemoveBackground(false);
        setFormatValue(getInitialOutputFormat(metadata.format));
        setPreviousFormatValue("");
        setQualityValue(92);
        setCompressionMode("quality");

        setResizeUnit("px");
        setDpiValue(DEFAULT_DPI);
      });
    } catch (err) {
      if (!disposed && requestId === uploadRequestId) {
        setError("Failed to load image. Please try another file.");
        console.error("Error loading image:", err);
      }
    }
  }

  function handleDownload(): void {
    const img = currentImage();
    const result = processResult();
    if (!img?.processedUrl || !result) return;

    // Use the encoded format for the extension if the requested format is unsupported.
    const filename = generateDownloadFilename(img.metadata.fileName, result.metadata.format);

    try {
      createDownloadLink(result.blob, filename);
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

    if (checked) warmBackgroundRemoval();
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

  function handleWidthInput(val: string): void {
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
    lastCompletedResult,
    isProcessing,
    progressLabel,
    error,
    validation,
    isDragOver,
    widthValue,
    heightValue,
    maintainAspectRatio,
    removeBackground,
    formatValue,
    previousFormatValue,
    qualityValue,
    compressionMode,
    targetFileSizeValue,
    targetFileSizeBytes,
    targetFileSizeInputInvalid,
    resizeUnit,
    dpiValue,
    currentOutputFormat,
    qualityControlSupported,
    controlsActive,
    formatSelectDisabled,
    downloadActive,
    widthPlaceholder,
    heightPlaceholder,
    sizeDifference,
    formatNotice,
    targetFileSizeNotice,
  };

  const actions: AppActions = {
    handleFileUpload,
    handleDownload,
    handleRemoveBackgroundChange,
    handleUnitChange,
    handleDpiChange,
    handleWidthInput,
    handleHeightInput,
    handleAspectRatioChange,
    setIsDragOver,
    setFormatValue,
    setQualityValue,
    setCompressionMode,
    setTargetFileSizeValue,
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
