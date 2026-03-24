import { createSignal, createMemo, createEffect, onCleanup, type Setter } from "solid-js";
import type { ProcessedImage, ValidationResult, ImageFormat } from "@/types/image";
import type { ProcessResult } from "@/types/processing";
import { processImage, getImageMetadata } from "@/services/imageService";
import { validateImageFile, generateDownloadFilename } from "@/services/validationService";
import {
  createDownloadLink,
  formatFileSize,
  generateId,
  calculateHeightFromWidth,
  calculateWidthFromHeight,
} from "@/utils/imageUtils";
import UploadArea from "./UploadArea";
import ProcessingControls from "./ProcessingControls";
import PreviewPanel from "./PreviewPanel";

export interface SizeDiff {
  text: string;
  className: string;
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

  // ── Form controls ─────────────────────────────────────────────────────────
  const [widthValue, setWidthValue] = createSignal("");
  const [heightValue, setHeightValue] = createSignal("");
  const [maintainAspectRatio, setMaintainAspectRatio] = createSignal(true);
  const [removeBackground, setRemoveBackground] = createSignal(false);
  const [formatValue, setFormatValue] = createSignal("");
  const [previousFormatValue, setPreviousFormatValue] = createSignal("");
  const [qualityValue, setQualityValue] = createSignal(92);

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
    return img ? String(img.metadata.width) : "Original";
  });

  const heightPlaceholder = createMemo(() => {
    const img = currentImage();
    return img ? String(img.metadata.height) : "Original";
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
    } catch (err) {
      setError("Failed to load image. Please try another file.");
      console.error("Error loading image:", err);
    }
  }

  async function handleProcess(): Promise<void> {
    const img = currentImage();
    if (!img || isProcessing()) return;

    const widthNum = widthValue() ? parseInt(widthValue(), 10) : undefined;
    const heightNum = heightValue() ? parseInt(heightValue(), 10) : undefined;

    const options = {
      removeBackground: removeBackground(),
      ...(widthNum || heightNum
        ? {
            resize: {
              width: widthNum,
              height: heightNum,
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

      // Update the current image's processedUrl in place
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

  function handleWidthInput(val: string): void {
    setWidthValue(val);
    if (maintainAspectRatio() && val) {
      const img = currentImage();
      if (img) {
        const w = parseInt(val, 10);
        if (!isNaN(w)) {
          setHeightValue(
            String(calculateHeightFromWidth(img.metadata.width, img.metadata.height, w))
          );
        }
      }
    }
  }

  function handleHeightInput(val: string): void {
    setHeightValue(val);
    if (maintainAspectRatio() && val) {
      const img = currentImage();
      if (img) {
        const h = parseInt(val, 10);
        if (!isNaN(h)) {
          setWidthValue(
            String(calculateWidthFromHeight(img.metadata.width, img.metadata.height, h))
          );
        }
      }
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
