import { createSignal, createMemo, createEffect, onCleanup, type Setter } from "solid-js";
import type { ProcessedImage, ValidationResult, ImageFormat } from "@/types/image";
import type { ProcessResult, ResizeUnit } from "@/types/processing";
import { processImage, getImageMetadata } from "@/services/imageService";
import {
  downloadProcessedBlob,
  replaceObjectUrl,
  revokeImageUrls,
} from "@/services/imageSessionService";
import {
  buildProcessOptions,
  getDimensionValuesForDpiChange,
  getFormatStateForBackgroundRemoval,
  getLinkedDimensionValues,
  getPresetResizeValues,
  rebaseDimensionValues,
} from "@/services/imageWorkflowService";
import { validateImageFile, generateDownloadFilename } from "@/services/validationService";
import { formatFileSize, generateId, convertFromPx } from "@/utils/imageUtils";
import { DEFAULT_DPI } from "@/config/constants";
import { SOCIAL_MEDIA_PRESETS } from "@/config/presets";
import UploadArea from "./UploadArea";
import ProcessingControls from "./ProcessingControls";
import PreviewPanel from "./PreviewPanel";

export interface SizeDiff {
  text: string;
  className: string;
}

/** Format a display-unit value to a readable string (no trailing zeros). */
function formatUnitValue(value: number, unit: ResizeUnit): string {
  if (unit === "px") return String(Math.round(value));
  // For non-px units show up to 2 decimal places, stripping trailing zeros
  return parseFloat(value.toFixed(2)).toString();
}

export default function ImageApp() {
  // ── Core image state ──────────────────────────────────────────────────────
  const [currentImage, setCurrentImage] = createSignal<ProcessedImage | null>(null);
  const [processResult, setProcessResult] = createSignal<ProcessResult | null>(null);

  // ── Async / loading state ─────────────────────────────────────────────────
  const [isProcessing, setIsProcessing] = createSignal(false);
  const [progressLabel, setProgressLabel] = createSignal<string | null>(null);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = createSignal<"original" | "processed">("original");
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

  onCleanup(() => {
    revokeImageUrls(currentImage());
  });

  // ── Derived signals ───────────────────────────────────────────────────────
  const controlsActive = createMemo(() => currentImage() !== null && !isProcessing());
  const formatSelectDisabled = createMemo(() => removeBackground());
  const downloadActive = createMemo(() => processResult() !== null);

  const processBtnLabel = createMemo(() => {
    if (!isProcessing()) return "Process Image";
    return progressLabel() ?? "Processing\u2026";
  });

  const widthPlaceholder = createMemo(() => {
    const img = currentImage();
    if (!img) return "Original";
    const px = img.metadata.width;
    const display = convertFromPx(px, resizeUnit(), px, dpiValue());
    return formatUnitValue(display, resizeUnit());
  });

  const heightPlaceholder = createMemo(() => {
    const img = currentImage();
    if (!img) return "Original";
    const px = img.metadata.height;
    const display = convertFromPx(px, resizeUnit(), px, dpiValue());
    return formatUnitValue(display, resizeUnit());
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

  // ── Auto-switch to processed tab when download becomes ready ──────────────
  createEffect(() => {
    if (downloadActive()) {
      setActiveTab("processed");
    }
  });

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

      // Reset stale state when a new file is loaded
      setCurrentImage((previousImage) => {
        revokeImageUrls(previousImage);
        return processedImage;
      });
      setProcessResult(null);
      setActiveTab("original");
      setError(null);

      // Reset form controls to defaults
      setWidthValue("");
      setHeightValue("");
      setMaintainAspectRatio(true);
      setRemoveBackground(false);
      setFormatValue("");
      setPreviousFormatValue("");
      setQualityValue(92);
      setTooltipOpen(false);

      // Reset unit controls
      setResizeUnit("px");
      setDpiValue(DEFAULT_DPI);
      setPresetValue("");
      setDpiTooltipOpen(false);
    } catch (err) {
      setError("Failed to load image. Please try another file.");
      console.error("Error loading image:", err);
    }
  }

  /**
   * Convert the current width/height display values to pixels,
   * then trigger processImage with those px dimensions.
   */
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
      setProgressLabel("Loading model\u2026");
    }

    try {
      const result = await processImage(
        img.file,
        options,
        options.removeBackground
          ? (progress: number) => {
              const pct = Math.round(progress * 100);
              setProgressLabel(`Loading model ${pct}%\u2026`);
            }
          : undefined
      );

      const processedUrl = replaceObjectUrl(img.processedUrl, result.blob);

      setCurrentImage((prev) => (prev ? { ...prev, processedUrl } : null));
      setProcessResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Processing failed");
      console.error("Error processing image:", err);
    } finally {
      setIsProcessing(false);
      setProgressLabel(null);
    }
  }

  function handleDownload(): void {
    const img = currentImage();
    const result = processResult();
    if (!img?.processedUrl || !result) return;

    const targetFormat: ImageFormat = removeBackground()
      ? "image/png"
      : ((formatValue() || img.metadata.format) as ImageFormat);

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

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <div class="sticky top-[68px] flex flex-col gap-4 self-start max-md:static">
        <UploadArea
          isDragOver={isDragOver}
          onDragOver={() => setIsDragOver(true)}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleFileUpload}
          onFileChange={handleFileUpload}
          validation={validation}
          currentImage={currentImage}
        />
        <ProcessingControls
          controlsActive={controlsActive}
          widthValue={widthValue}
          setWidthValue={handleWidthInput}
          heightValue={heightValue}
          setHeightValue={handleHeightInput}
          maintainAspectRatio={maintainAspectRatio}
          onAspectRatioChange={handleAspectRatioChange}
          removeBackground={removeBackground}
          onRemoveBackgroundChange={handleRemoveBackgroundChange}
          formatValue={formatValue}
          setFormatValue={setFormatValue}
          formatSelectDisabled={formatSelectDisabled}
          qualityValue={qualityValue}
          setQualityValue={setQualityValue}
          tooltipOpen={tooltipOpen}
          setTooltipOpen={setTooltipOpen}
          isProcessing={isProcessing}
          processBtnLabel={processBtnLabel}
          onProcess={handleProcess}
          widthPlaceholder={widthPlaceholder}
          heightPlaceholder={heightPlaceholder}
          resizeUnit={resizeUnit}
          onUnitChange={handleUnitChange}
          dpiValue={dpiValue}
          onDpiChange={handleDpiChange}
          dpiTooltipOpen={dpiTooltipOpen}
          setDpiTooltipOpen={setDpiTooltipOpen}
          presetValue={presetValue}
          onPresetChange={handlePresetChange}
        />
      </div>
      <PreviewPanel
        currentImage={currentImage}
        processResult={processResult}
        activeTab={activeTab}
        setActiveTab={setActiveTab as Setter<"original" | "processed">}
        downloadActive={downloadActive}
        onDownload={handleDownload}
        error={error}
        sizeDifference={sizeDifference}
      />
    </>
  );
}
