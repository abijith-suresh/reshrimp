import { batch, createEffect, on, type Accessor, type Setter } from "solid-js";
import type { ProcessedImage, ValidationResult } from "@/types/image";
import type { ProcessResult, ResizeUnit } from "@/types/processing";
import { processImage, getImageMetadata } from "@/services/imageService";
import { buildProcessOptions } from "@/services/imageWorkflowService";
import {
  downloadProcessedBlob,
  replaceObjectUrl,
  revokeImageUrls,
} from "@/services/imageSessionService";
import { generateDownloadFilename, validateImageFile } from "@/services/validationService";
import { generateId } from "@/utils/imageUtils";
import { getInitialOutputFormat } from "@/config/imageFormats";
import type { ImageFormat } from "@/types/image";

interface PipelineDeps {
  currentImage: Accessor<ProcessedImage | null>;
  setCurrentImage: Setter<ProcessedImage | null>;
  processResult: Accessor<ProcessResult | null>;
  setProcessResult: Setter<ProcessResult | null>;
  isProcessing: Accessor<boolean>;
  setIsProcessing: Setter<boolean>;
  setProgressLabel: Setter<string | null>;
  setError: Setter<string | null>;
  setValidation: Setter<ValidationResult | null>;
  setTooltipOpen: Setter<boolean>;
  setDpiTooltipOpen: Setter<boolean>;
  widthValue: Accessor<string>;
  heightValue: Accessor<string>;
  maintainAspectRatio: Accessor<boolean>;
  removeBackground: Accessor<boolean>;
  formatValue: Accessor<string>;
  qualityValue: Accessor<number>;
  resizeUnit: Accessor<ResizeUnit>;
  dpiValue: Accessor<number>;
  presetValue: Accessor<string>;
  currentOutputFormat: Accessor<ImageFormat | null>;
  qualityControlSupported: Accessor<boolean>;
  resetFormControls: (initialFormat: ImageFormat) => void;
}

export function createProcessingPipeline(deps: PipelineDeps) {
  async function handleProcess(): Promise<void> {
    const img = deps.currentImage();
    if (!img || deps.isProcessing()) return;

    const options = buildProcessOptions({
      originalWidth: img.metadata.width,
      originalHeight: img.metadata.height,
      widthValue: deps.widthValue(),
      heightValue: deps.heightValue(),
      maintainAspectRatio: deps.maintainAspectRatio(),
      removeBackground: deps.removeBackground(),
      formatValue: deps.formatValue(),
      qualityValue: deps.qualityValue(),
      resizeUnit: deps.resizeUnit(),
      dpi: deps.dpiValue(),
    });

    deps.setIsProcessing(true);
    deps.setError(null);

    if (options.removeBackground) {
      deps.setProgressLabel("Removing background\u2026");
    }

    try {
      const result = await processImage(
        img.file,
        options,
        options.removeBackground
          ? (progress: number) => {
              const pct = Math.round(progress * 100);
              deps.setProgressLabel(`Removing background ${pct}%\u2026`);
            }
          : undefined
      );

      const processedUrl = replaceObjectUrl(img.processedUrl, result.blob);

      batch(() => {
        deps.setCurrentImage((prev) => (prev ? { ...prev, processedUrl } : null));
        deps.setProcessResult(result);
      });
    } catch (err) {
      deps.setError(err instanceof Error ? err.message : "Processing failed");
      console.error("Error processing image:", err);
    } finally {
      batch(() => {
        deps.setIsProcessing(false);
        deps.setProgressLabel(null);
      });
    }
  }

  function setupAutoProcessEffect(debouncedProcess: { run(): void }) {
    createEffect(
      on(
        [
          deps.currentImage,
          deps.widthValue,
          deps.heightValue,
          deps.formatValue,
          () => (deps.qualityControlSupported() ? deps.qualityValue() : null),
          deps.resizeUnit,
          deps.dpiValue,
          deps.presetValue,
          deps.maintainAspectRatio,
          deps.removeBackground,
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
  }

  async function handleFileUpload(file: File): Promise<void> {
    const validationResult = validateImageFile(file);
    deps.setValidation(validationResult);

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

      batch(() => {
        deps.setCurrentImage((previousImage) => {
          revokeImageUrls(previousImage);
          return processedImage;
        });
        deps.setProcessResult(null);
        deps.setError(null);
        deps.resetFormControls(getInitialOutputFormat(metadata.format));
        deps.setTooltipOpen(false);
        deps.setDpiTooltipOpen(false);
      });
    } catch (err) {
      deps.setError("Failed to load image. Please try another file.");
      console.error("Error loading image:", err);
    }
  }

  function handleDownload(): void {
    const img = deps.currentImage();
    const result = deps.processResult();
    if (!img?.processedUrl || !result) return;

    const targetFormat = deps.currentOutputFormat();
    if (!targetFormat) return;

    const filename = generateDownloadFilename(img.metadata.fileName, targetFormat);

    try {
      downloadProcessedBlob(result.blob, filename);
    } catch (err) {
      deps.setError("Failed to download image");
      console.error("Download error:", err);
    }
  }

  return { handleProcess, setupAutoProcessEffect, handleFileUpload, handleDownload };
}
