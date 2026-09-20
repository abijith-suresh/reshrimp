import {
  batch,
  createContext,
  createEffect,
  createMemo,
  createSignal,
  type JSX,
  on,
  onCleanup,
  useContext,
} from "solid-js";
import {
  getImageFormatLabel,
  getInitialOutputFormat,
  supportsBrowserQualityControl,
} from "@/config/imageFormats";
import { preloadBackgroundRemoval } from "@/services/backgroundRemovalService";
import { getImageMetadata, prepareImageFile, processImage } from "@/services/imageService";
import {
  buildProcessOptions,
  getFormatStateForBackgroundRemoval,
  getLinkedDimensionValues,
  rebaseDimensionValues,
} from "@/services/imageWorkflowService";
import {
  generateDownloadFilename,
  validateImageDimensions,
  validateImageFile,
  validateResizeOptions,
} from "@/services/validationService";
import type { ImageFormat, ProcessedImage, ValidationResult } from "@/types/image";
import type { ProcessResult, ResizeUnit } from "@/types/processing";
import { createDownloadLink, formatFileSize } from "@/utils/imageUtils";
import {
  replaceProcessedObjectUrl,
  revokeImageSessionUrls,
  revokeProcessedObjectUrl,
} from "./imageAppObjectUrls";
import type { AppActions, AppState, ImageAppContextValue, SizeDiff } from "./imageAppTypes";

interface ProcessingSettings {
  widthValue: string;
  heightValue: string;
  widthPx: number | undefined;
  heightPx: number | undefined;
  maintainAspectRatio: boolean;
  removeBackground: boolean;
  formatValue: string;
  qualityValue: number;
  qualityRelevant: boolean;
  resizeUnit: ResizeUnit;
}

const DEFAULT_QUALITY_VALUE = 92;

function getResizeValidationMessage(
  error: string,
  unit: ResizeUnit,
  metadata: Pick<ProcessedImage["metadata"], "width" | "height">
): string {
  if (unit !== "%" || !error.includes("must be at least 1px")) return error;

  const label = error.startsWith("Height") ? "Height" : "Width";
  const originalPixels = label === "Height" ? metadata.height : metadata.width;
  const minimumPercent = Math.ceil((100 / originalPixels) * 1000) / 1000;
  return `${label} must be at least ${minimumPercent}% to produce 1px`;
}

function focusResizeField(error: string): void {
  const dimension = error.startsWith("Height") ? "height" : "width";
  const preferMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const prefixes = preferMobile ? ["mobile-"] : [""];
  const input = prefixes
    .map((prefix) => document.getElementById(`${prefix}${dimension}-input`))
    .find((element): element is HTMLInputElement => {
      return (
        element instanceof HTMLInputElement && !element.disabled && !element.closest("[inert]")
      );
    });

  if (input) {
    input.focus();
  } else if (preferMobile) {
    window.dispatchEvent(new CustomEvent("reshrimp:focus-resize-field", { detail: { dimension } }));
  }
}

function haveSameProcessingSettings(
  first: ProcessingSettings,
  second: ProcessingSettings
): boolean {
  const resizeMatches =
    first.resizeUnit === second.resizeUnit
      ? first.widthValue === second.widthValue && first.heightValue === second.heightValue
      : first.widthPx === second.widthPx && first.heightPx === second.heightPx;

  return (
    resizeMatches &&
    first.maintainAspectRatio === second.maintainAspectRatio &&
    first.removeBackground === second.removeBackground &&
    first.formatValue === second.formatValue &&
    (!first.qualityRelevant ||
      !second.qualityRelevant ||
      first.qualityValue === second.qualityValue)
  );
}

const ImageAppContext = createContext<ImageAppContextValue>();

export function ImageAppProvider(props: { children: JSX.Element }) {
  // ── Core image state ──────────────────────────────────────────────────────
  const [currentImage, setCurrentImage] = createSignal<ProcessedImage | null>(null);
  const [processResult, setProcessResult] = createSignal<ProcessResult | null>(null);
  const [appliedSettings, setAppliedSettings] = createSignal<ProcessingSettings | null>(null);

  // ── Session identity ──────────────────────────────────────────────────────
  // Bumped on every successful upload. Processing is keyed off this id, never
  // off the currentImage object: a processing completion rewrites currentImage,
  // so depending on its identity would re-trigger processing forever.
  const [sessionId, setSessionId] = createSignal(0);

  // Session of the in-flight run; null when idle. Guarding with a plain
  // variable (not the isProcessing signal) keeps stale completions from
  // clobbering the state of a newer run.
  let activeRunSession: number | null = null;
  let activeRunId: number | null = null;
  let nextRunId = 0;
  let uploadRequestId = 0;
  let disposed = false;
  let processingRevision = 0;
  let preloadRequested = false;
  let lastProgressAnnouncement = -10;
  let applyRequested = false;

  // ── Async / loading state ─────────────────────────────────────────────────
  const [isProcessing, setIsProcessing] = createSignal(false);
  const [progressLabel, setProgressLabel] = createSignal<string | null>(null);
  const [statusMessage, setStatusMessage] = createSignal<string | null>(null);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [error, setError] = createSignal<string | null>(null);
  const [resizeError, setResizeError] = createSignal<string | null>(null);
  const [validation, setValidation] = createSignal<ValidationResult | null>(null);
  const [isDragOver, setIsDragOver] = createSignal(false);
  const [tooltipOpen, setTooltipOpen] = createSignal(false);
  const [hasPendingChanges, setHasPendingChanges] = createSignal(false);

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

  onCleanup(() => {
    disposed = true;
    revokeImageSessionUrls(currentImage());
  });

  // ── Derived signals ───────────────────────────────────────────────────────
  const controlsActive = createMemo(() => currentImage() !== null && !isProcessing());
  const formatSelectDisabled = createMemo(() => removeBackground());
  const downloadActive = createMemo(
    () => !hasPendingChanges() && processResult() !== null && currentImage()?.processedUrl !== null
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
    if (format === null || !supportsBrowserQualityControl(format)) return false;

    const applied = appliedSettings();
    return !(applied?.formatValue === format && applied.qualityRelevant === false);
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
      className: diff > 0 ? "font-medium text-coral-500" : "font-medium text-mint-600",
    };
  });

  const formatNotice = createMemo<string | null>(() => {
    const result = processResult();
    if (!result || hasPendingChanges()) return null;

    const requestedFormat = result.requestedFormat;
    if (requestedFormat === result.metadata.format) return null;

    return `Your browser could not export ${getImageFormatLabel(requestedFormat)}. Downloaded as ${getImageFormatLabel(result.metadata.format)} instead.`;
  });

  function getProcessingSettings(qualityRelevant = qualityControlSupported()): ProcessingSettings {
    const image = currentImage();
    const resize = image
      ? buildProcessOptions({
          originalWidth: image.metadata.width,
          originalHeight: image.metadata.height,
          widthValue: widthValue(),
          heightValue: heightValue(),
          maintainAspectRatio: maintainAspectRatio(),
          removeBackground: removeBackground(),
          formatValue: formatValue(),
          qualityValue: qualityValue(),
          resizeUnit: resizeUnit(),
        }).resize
      : undefined;

    return {
      widthValue: widthValue(),
      heightValue: heightValue(),
      widthPx: resize?.width,
      heightPx: resize?.height,
      maintainAspectRatio: maintainAspectRatio(),
      removeBackground: removeBackground(),
      formatValue: formatValue(),
      qualityValue: qualityRelevant ? qualityValue() : DEFAULT_QUALITY_VALUE,
      qualityRelevant,
      resizeUnit: resizeUnit(),
    };
  }

  // ── Core processing (internal) ────────────────────────────────────────────
  async function handleProcess(): Promise<void> {
    if (disposed) return;

    const img = currentImage();
    if (!img) return;

    if (activeRunSession !== null) return;

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
      resizeUnit: resizeUnit(),
    });

    const resizeValidation = validateResizeOptions(img.metadata, options.resize);
    if (!resizeValidation.valid) {
      applyRequested = false;
      const resizeError = getResizeValidationMessage(
        resizeValidation.error ?? "Invalid dimensions",
        resizeUnit(),
        img.metadata
      );
      batch(() => {
        setError(resizeError);
        setResizeError(resizeError);
        setHasPendingChanges(true);
        setStatusMessage(null);
      });
      queueMicrotask(() => focusResizeField(resizeError));
      return;
    }

    activeRunSession = session;
    activeRunId = runId;
    lastProgressAnnouncement = -10;

    const isCurrentRun = () =>
      !disposed &&
      activeRunSession === session &&
      activeRunId === runId &&
      sessionId() === session &&
      processingRevision === runRevision;

    batch(() => {
      if (img.processedUrl) {
        revokeProcessedObjectUrl(img.processedUrl);
        setCurrentImage((previousImage) =>
          previousImage?.processedUrl === img.processedUrl
            ? { ...previousImage, processedUrl: null }
            : previousImage
        );
      }
      setProcessResult(null);
      setIsProcessing(true);
      setError(null);
      setResizeError(null);
      setStatusMessage(null);
    });

    setProgressLabel(options.removeBackground ? "Removing background…" : "Processing…");

    try {
      const result = await processImage(
        img.file,
        options,
        options.removeBackground
          ? (progress: number) => {
              if (!isCurrentRun()) return;
              const pct = Math.round(progress * 100);
              if (pct < 100 && pct - lastProgressAnnouncement < 10) return;
              lastProgressAnnouncement = pct;
              setProgressLabel(`Removing background ${pct}%\u2026`);
            }
          : undefined
      );

      // A new upload started a different session while this run was in
      // flight — discard the result instead of stamping it onto the new image.
      if (!isCurrentRun()) return;

      const processedUrl = replaceProcessedObjectUrl(null, result.blob);
      const wasExplicitApply = applyRequested;
      applyRequested = false;

      // Batch result updates into a single DOM update
      batch(() => {
        setCurrentImage((prev) => (prev ? { ...prev, processedUrl } : null));
        setProcessResult(result);
        setAppliedSettings(
          getProcessingSettings(
            supportsBrowserQualityControl(result.metadata.format as ImageFormat)
          )
        );
        setHasPendingChanges(false);
        setResizeError(null);
        setStatusMessage(
          wasExplicitApply
            ? "Changes applied. Ready to download."
            : "Image ready. Ready to download."
        );
      });
    } catch (err) {
      if (isCurrentRun()) {
        applyRequested = false;
        setError(err instanceof Error ? err.message : "Processing failed");
        setResizeError(null);
        setHasPendingChanges(true);
        setStatusMessage(null);
        console.error("Error processing image:", err);
      }
    } finally {
      const ownsRun = activeRunSession === session && activeRunId === runId;
      if (ownsRun) activeRunSession = null;
      if (ownsRun) activeRunId = null;
      if (ownsRun && !disposed) {
        batch(() => {
          setIsProcessing(false);
          setProgressLabel(null);
        });
      }
    }
  }

  // A new upload gets one automatic processing pass. All later changes stay
  // in the draft controls until the user explicitly applies them.
  createEffect(
    on(
      sessionId,
      () => {
        if (currentImage()) void handleProcess();
      },
      { defer: true }
    )
  );

  // ── Handlers ──────────────────────────────────────────────────────────────
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

      // Batch all state resets into a single DOM update to prevent flickering.
      // Without batch(), each set* after an await triggers a separate re-render.
      batch(() => {
        // Reset stale state when a new file is loaded
        // Detach the previous run before starting the new session. Its
        // eventual completion is stale and must not keep the new session
        // waiting for an active run that belongs to the old image.
        activeRunSession = null;
        activeRunId = null;
        setIsProcessing(false);
        setCurrentImage((previousImage) => {
          revokeImageSessionUrls(previousImage);
          return processedImage;
        });
        setSessionId((id) => id + 1);
        setProcessResult(null);
        setAppliedSettings(null);
        setError(null);
        setResizeError(null);
        setProgressLabel(null);
        setStatusMessage(null);
        applyRequested = false;

        // Reset form controls to defaults
        setWidthValue(String(metadata.width));
        setHeightValue(String(metadata.height));
        setMaintainAspectRatio(true);
        setRemoveBackground(false);
        setFormatValue(getInitialOutputFormat(metadata.format));
        setPreviousFormatValue("");
        setQualityValue(92);
        setTooltipOpen(false);

        // Reset unit controls
        setResizeUnit("px");
        setHasPendingChanges(false);
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

    // Name the file after the ACTUAL encoded format: getBestFormat can fall
    // back when the browser cannot encode the requested format (e.g. AVIF →
    // PNG), so the extension must match the blob's bytes, not the request.
    const filename = generateDownloadFilename(img.metadata.fileName, result.metadata.format);

    try {
      createDownloadLink(result.blob, filename);
    } catch (err) {
      setError("Failed to download image");
      console.error("Download error:", err);
    }
  }

  function markChangesPending(): void {
    processingRevision += 1;
    setError(null);
    setResizeError(null);
    setStatusMessage(null);
    const applied = appliedSettings();
    setHasPendingChanges(
      applied === null ||
        processResult() === null ||
        currentImage()?.processedUrl === null ||
        !haveSameProcessingSettings(getProcessingSettings(), applied)
    );
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
    markChangesPending();

    // Warm the model on first use instead of on every app visit — the
    // download is large and most sessions never touch background removal.
    if (checked && !preloadRequested) {
      preloadRequested = true;
      void preloadBackgroundRemoval().catch(() => {
        // Non-fatal: the removeBackground call loads the module on use.
      });
    }
  }

  function handleUnitChange(newUnit: ResizeUnit): void {
    if (newUnit === resizeUnit()) return;

    const img = currentImage();

    if (img) {
      const nextDimensions = rebaseDimensionValues({
        widthValue: widthValue(),
        heightValue: heightValue(),
        oldUnit: resizeUnit(),
        newUnit,
        originalWidth: img.metadata.width,
        originalHeight: img.metadata.height,
      });

      setWidthValue(nextDimensions.widthValue);
      setHeightValue(nextDimensions.heightValue);
    }

    setResizeUnit(newUnit);
    markChangesPending();
  }

  function handleWidthInput(val: string): void {
    if (!maintainAspectRatio()) {
      setWidthValue(val);
      markChangesPending();
      return;
    }

    const img = currentImage();
    if (!img) {
      setWidthValue(val);
      markChangesPending();
      return;
    }

    const linkedDimensions = getLinkedDimensionValues({
      changedDimension: "width",
      value: val,
      resizeUnit: resizeUnit(),
      originalWidth: img.metadata.width,
      originalHeight: img.metadata.height,
    });

    if (!linkedDimensions) {
      setWidthValue(val);
      markChangesPending();
      return;
    }

    setWidthValue(linkedDimensions.widthValue);
    setHeightValue(linkedDimensions.heightValue);
    markChangesPending();
  }

  function handleHeightInput(val: string): void {
    if (!maintainAspectRatio()) {
      setHeightValue(val);
      markChangesPending();
      return;
    }

    const img = currentImage();
    if (!img) {
      setHeightValue(val);
      markChangesPending();
      return;
    }

    const linkedDimensions = getLinkedDimensionValues({
      changedDimension: "height",
      value: val,
      resizeUnit: resizeUnit(),
      originalWidth: img.metadata.width,
      originalHeight: img.metadata.height,
    });

    if (!linkedDimensions) {
      setHeightValue(val);
      markChangesPending();
      return;
    }

    setWidthValue(linkedDimensions.widthValue);
    setHeightValue(linkedDimensions.heightValue);
    markChangesPending();
  }

  function handleAspectRatioChange(checked: boolean): void {
    setMaintainAspectRatio(checked);
    if (checked && widthValue()) {
      handleWidthInput(widthValue());
      return;
    }
    if (checked && heightValue()) {
      handleHeightInput(heightValue());
      return;
    }
    markChangesPending();
  }

  function applyChanges(): void {
    if (!currentImage() || isProcessing() || !hasPendingChanges()) return;
    applyRequested = true;
    setStatusMessage(null);
    setHasPendingChanges(false);
    void handleProcess();
  }

  function handleFormatChange(value: string): void {
    if (value === formatValue()) return;
    setFormatValue(value);
    markChangesPending();
  }

  function handleQualityChange(value: number): void {
    if (value === qualityValue()) return;
    setQualityValue(value);
    markChangesPending();
  }

  const state: AppState = {
    currentImage,
    processResult,
    isProcessing,
    progressLabel,
    statusMessage,
    error,
    resizeError,
    validation,
    isDragOver,
    tooltipOpen,
    widthValue,
    heightValue,
    maintainAspectRatio,
    removeBackground,
    formatValue,
    previousFormatValue,
    qualityValue,
    resizeUnit,
    currentOutputFormat,
    qualityControlSupported,
    controlsActive,
    formatSelectDisabled,
    downloadActive,
    hasPendingChanges,
    sizeDifference,
    formatNotice,
  };

  const actions: AppActions = {
    handleFileUpload,
    handleDownload,
    handleRemoveBackgroundChange,
    handleUnitChange,
    handleWidthInput,
    handleHeightInput,
    handleAspectRatioChange,
    applyChanges,
    setIsDragOver,
    setTooltipOpen,
    handleFormatChange,
    handleQualityChange,
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
