import { createSignal, createMemo, createEffect, onCleanup, type Setter } from "solid-js";
import type { ProcessedImage, ValidationResult, ImageFormat } from "@/types/image";
import type { ProcessResult, ResizeUnit } from "@/types/processing";
import { processImage, getImageMetadata } from "@/services/imageService";
import { validateImageFile, generateDownloadFilename } from "@/services/validationService";
import {
  createDownloadLink,
  formatFileSize,
  generateId,
  calculateHeightFromWidth,
  calculateWidthFromHeight,
  convertToPx,
  convertFromPx,
} from "@/utils/imageUtils";
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

  // ── Object URL tracking for cleanup ──────────────────────────────────────
  const [objectUrls, setObjectUrls] = createSignal<string[]>([]);

  function trackUrl(url: string): string {
    setObjectUrls((prev) => [...prev, url]);
    return url;
  }

  onCleanup(() => {
    objectUrls().forEach((url) => URL.revokeObjectURL(url));
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
      const url = trackUrl(URL.createObjectURL(file));

      const processedImage: ProcessedImage = {
        id: generateId(),
        file,
        originalUrl: url,
        processedUrl: null,
        metadata,
        processing: false,
        error: null,
      };

      // Reset stale state when a new file is loaded
      setCurrentImage(processedImage);
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

    const unit = resizeUnit();
    const dpi = dpiValue();

    const wRaw = widthValue() ? parseFloat(widthValue()) : NaN;
    const hRaw = heightValue() ? parseFloat(heightValue()) : NaN;

    const widthPx = isNaN(wRaw) ? undefined : convertToPx(wRaw, unit, img.metadata.width, dpi);
    const heightPx = isNaN(hRaw) ? undefined : convertToPx(hRaw, unit, img.metadata.height, dpi);

    const options = {
      removeBackground: removeBackground(),
      ...(widthPx || heightPx
        ? {
            resize: {
              width: widthPx,
              height: heightPx,
              maintainAspectRatio: maintainAspectRatio(),
            },
          }
        : {}),
      ...(formatValue() ? { format: formatValue() as ImageFormat } : {}),
      quality: qualityValue() / 100,
    };

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

      const processedUrl = trackUrl(URL.createObjectURL(result.blob));

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
    if (!img?.processedUrl) return;

    const targetFormat: ImageFormat = removeBackground()
      ? "image/png"
      : ((formatValue() || img.metadata.format) as ImageFormat);

    const filename = generateDownloadFilename(img.metadata.fileName, targetFormat);

    fetch(img.processedUrl)
      .then((r) => r.blob())
      .then((blob) => createDownloadLink(blob, filename))
      .catch((err) => {
        setError("Failed to download image");
        console.error("Download error:", err);
      });
  }

  function handleRemoveBackgroundChange(checked: boolean): void {
    if (checked) {
      setPreviousFormatValue(formatValue());
      setFormatValue("image/png");
    } else {
      setFormatValue(previousFormatValue());
    }
    setRemoveBackground(checked);
  }

  /**
   * Convert an existing display value between units.
   * Returns the new display string, or "" if the input is empty/invalid.
   */
  function rebaseValue(
    displayStr: string,
    oldUnit: ResizeUnit,
    newUnit: ResizeUnit,
    originalPx: number,
    dpi: number
  ): string {
    if (!displayStr) return "";
    const num = parseFloat(displayStr);
    if (isNaN(num)) return "";
    const px = convertToPx(num, oldUnit, originalPx, dpi);
    const newDisplay = convertFromPx(px, newUnit, originalPx, dpi);
    return formatUnitValue(newDisplay, newUnit);
  }

  function handleUnitChange(newUnit: ResizeUnit): void {
    const img = currentImage();
    const oldUnit = resizeUnit();
    const dpi = dpiValue();

    if (img) {
      setWidthValue(rebaseValue(widthValue(), oldUnit, newUnit, img.metadata.width, dpi));
      setHeightValue(rebaseValue(heightValue(), oldUnit, newUnit, img.metadata.height, dpi));
    }

    setResizeUnit(newUnit);
  }

  function handleDpiChange(newDpi: number): void {
    const img = currentImage();
    const unit = resizeUnit();
    const oldDpi = dpiValue();

    // Only physical units are affected by DPI changes; % and px are invariant
    if (img && (unit === "in" || unit === "cm")) {
      // Convert display → px (old DPI) → display (new DPI)
      if (widthValue()) {
        const w = parseFloat(widthValue());
        if (!isNaN(w)) {
          const px = convertToPx(w, unit, img.metadata.width, oldDpi);
          setWidthValue(formatUnitValue(convertFromPx(px, unit, img.metadata.width, newDpi), unit));
        }
      }
      if (heightValue()) {
        const h = parseFloat(heightValue());
        if (!isNaN(h)) {
          const px = convertToPx(h, unit, img.metadata.height, oldDpi);
          setHeightValue(
            formatUnitValue(convertFromPx(px, unit, img.metadata.height, newDpi), unit)
          );
        }
      }
    }

    setDpiValue(newDpi);
  }

  function handlePresetChange(label: string): void {
    setPresetValue(label);
    if (!label) return; // "Custom" — don't touch W/H

    const preset = SOCIAL_MEDIA_PRESETS.find((p) => p.label === label);
    if (!preset) return;

    // Presets are always in px — switch unit first, then set values atomically
    // bypassing aspect-ratio linkage by setting both fields directly
    setResizeUnit("px");
    setWidthValue(String(preset.width));
    setHeightValue(String(preset.height));
  }

  /**
   * Aspect-ratio-aware width handler.
   * Operates entirely in display units.
   */
  function handleWidthInput(val: string): void {
    setWidthValue(val);
    setPresetValue(""); // user edited manually → reset preset

    if (maintainAspectRatio() && val) {
      const img = currentImage();
      if (!img) return;

      const num = parseFloat(val);
      if (isNaN(num)) return;

      const unit = resizeUnit();
      const dpi = dpiValue();

      // Convert entered width to px, compute linked height in px, convert back
      const wPx = convertToPx(num, unit, img.metadata.width, dpi);
      const hPx = calculateHeightFromWidth(img.metadata.width, img.metadata.height, wPx);
      setHeightValue(formatUnitValue(convertFromPx(hPx, unit, img.metadata.height, dpi), unit));
    }
  }

  /**
   * Aspect-ratio-aware height handler.
   * Operates entirely in display units.
   */
  function handleHeightInput(val: string): void {
    setHeightValue(val);
    setPresetValue(""); // user edited manually → reset preset

    if (maintainAspectRatio() && val) {
      const img = currentImage();
      if (!img) return;

      const num = parseFloat(val);
      if (isNaN(num)) return;

      const unit = resizeUnit();
      const dpi = dpiValue();

      // Convert entered height to px, compute linked width in px, convert back
      const hPx = convertToPx(num, unit, img.metadata.height, dpi);
      const wPx = calculateWidthFromHeight(img.metadata.width, img.metadata.height, hPx);
      setWidthValue(formatUnitValue(convertFromPx(wPx, unit, img.metadata.width, dpi), unit));
    }
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
