import type { ImageState, ProcessedImage, ImageFormat } from '../types/image';
import type { ProcessOptions } from '../types/processing';
import { processImage, getImageMetadata } from '../services/imageService';
import { validateImageFile, generateDownloadFilename } from '../services/validationService';
import { createDownloadLink, formatFileSize, generateId } from '../utils/imageUtils';

/**
 * Main controller class for image processing
 * Manages state and orchestrates UI updates
 */
export class ImageProcessorController {
  private state: ImageState = {
    images: [],
    selectedIndex: 0,
  };

  private objectUrls: string[] = [];

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the controller and set up event listeners
   */
  private initialize(): void {
    this.setupFileInput();
    this.setupDragAndDrop();
    this.setupProcessButton();
    this.setupDownloadButton();
    this.setupQualitySlider();
    this.setupResizeInputs();
    this.setupBackgroundRemovalCheckbox();
  }

  /**
   * Set up file input change listener
   */
  private setupFileInput(): void {
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    const uploadArea = document.getElementById('upload-area');

    uploadArea?.addEventListener('click', () => {
      fileInput?.click();
    });

    fileInput?.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        this.handleFileUpload(file);
        // Reset file input to allow re-selection of same file
        target.value = '';
      }
    });
  }

  /**
   * Set up drag and drop listeners
   */
  private setupDragAndDrop(): void {
    const uploadArea = document.getElementById('upload-area');

    uploadArea?.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.classList.add('sp-drag-active');
    });

    uploadArea?.addEventListener('dragleave', () => {
      uploadArea.classList.remove('sp-drag-active');
    });

    uploadArea?.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('sp-drag-active');

      const file = e.dataTransfer?.files[0];
      if (file) {
        this.handleFileUpload(file);
      }
    });
  }

  /**
   * Set up process button listener
   */
  private setupProcessButton(): void {
    const processButton = document.getElementById('process-button');
    processButton?.addEventListener('click', (e) => {
      e.preventDefault();
      this.processCurrentImage();
    });
  }

  /**
   * Set up download button listener
   */
  private setupDownloadButton(): void {
    const downloadButton = document.getElementById('download-button');
    downloadButton?.addEventListener('click', () => {
      this.downloadProcessedImage();
    });
  }

  /**
   * Set up quality slider to update display value
   */
  private setupQualitySlider(): void {
    const qualitySlider = document.getElementById('quality-slider') as HTMLInputElement;
    const qualityValue = document.getElementById('quality-value');

    qualitySlider?.addEventListener('input', () => {
      if (qualityValue) {
        qualityValue.textContent = `${qualitySlider.value}%`;
      }
    });
  }

  /**
   * Set up resize inputs to auto-calculate based on aspect ratio
   */
  private setupResizeInputs(): void {
    const widthInput = document.getElementById('width-input') as HTMLInputElement;
    const heightInput = document.getElementById('height-input') as HTMLInputElement;
    const aspectRatioCheckbox = document.getElementById(
      'maintain-aspect-ratio'
    ) as HTMLInputElement;

    let lastChanged: 'width' | 'height' | null = null;

    widthInput?.addEventListener('input', () => {
      lastChanged = 'width';
      if (aspectRatioCheckbox?.checked) {
        this.updateHeightFromWidth();
      }
    });

    heightInput?.addEventListener('input', () => {
      lastChanged = 'height';
      if (aspectRatioCheckbox?.checked) {
        this.updateWidthFromHeight();
      }
    });

    aspectRatioCheckbox?.addEventListener('change', () => {
      if (aspectRatioCheckbox.checked && lastChanged === 'width') {
        this.updateHeightFromWidth();
      } else if (aspectRatioCheckbox.checked && lastChanged === 'height') {
        this.updateWidthFromHeight();
      }
    });
  }

  /**
   * Set up background removal checkbox to show/hide notes and handle format override
   */
  private setupBackgroundRemovalCheckbox(): void {
    const removeBgCheckbox = document.getElementById(
      'remove-background-checkbox'
    ) as HTMLInputElement;
    const bgNote = document.getElementById('background-removal-note');
    const formatNote = document.getElementById('format-override-note');

    removeBgCheckbox?.addEventListener('change', () => {
      const isChecked = removeBgCheckbox?.checked ?? false;

      if (bgNote) {
        bgNote.classList.toggle('hidden', !isChecked);
      }

      if (formatNote) {
        formatNote.classList.toggle('hidden', !isChecked);
      }
    });
  }

  /**
   * Update height input based on width and aspect ratio
   */
  private updateHeightFromWidth(): void {
    const currentImage = this.state.images[this.state.selectedIndex];
    if (!currentImage) return;

    const widthInput = document.getElementById('width-input') as HTMLInputElement;
    const heightInput = document.getElementById('height-input') as HTMLInputElement;

    if (widthInput && heightInput && widthInput.value) {
      const width = parseInt(widthInput.value, 10);
      const aspectRatio = currentImage.metadata.width / currentImage.metadata.height;
      const height = Math.round(width / aspectRatio);
      heightInput.value = height.toString();
    }
  }

  /**
   * Update width input based on height and aspect ratio
   */
  private updateWidthFromHeight(): void {
    const currentImage = this.state.images[this.state.selectedIndex];
    if (!currentImage) return;

    const widthInput = document.getElementById('width-input') as HTMLInputElement;
    const heightInput = document.getElementById('height-input') as HTMLInputElement;

    if (widthInput && heightInput && heightInput.value) {
      const height = parseInt(heightInput.value, 10);
      const aspectRatio = currentImage.metadata.width / currentImage.metadata.height;
      const width = Math.round(height * aspectRatio);
      widthInput.value = width.toString();
    }
  }

  /**
   * Handle file upload
   */
  private async handleFileUpload(file: File): Promise<void> {
    // Validate file
    const validation = validateImageFile(file);
    this.displayValidationMessage(validation);

    if (!validation.valid) {
      return;
    }

    try {
      // Get metadata
      const metadata = await getImageMetadata(file);

      // Create object URL
      const url = URL.createObjectURL(file);
      this.objectUrls.push(url);

      // Create processed image object
      const processedImage: ProcessedImage = {
        id: generateId(),
        file,
        originalUrl: url,
        processedUrl: null,
        metadata,
        processing: false,
        error: null,
      };

      // Update state (array-based for future batch support)
      this.state.images = [processedImage];
      this.state.selectedIndex = 0;

      // Update UI
      this.displayFileInfo(file);
      this.displayOriginalPreview(processedImage);
      this.showControls();
      this.populateDefaultValues(metadata);
      this.hideError();
    } catch (error) {
      this.displayError('Failed to load image. Please try another file.');
      console.error('Error loading image:', error);
    }
  }

  /**
   * Display validation message
   */
  private displayValidationMessage(validation: {
    valid: boolean;
    error?: string;
    warning?: string;
  }): void {
    const messageEl = document.getElementById('validation-message');
    if (!messageEl) return;

    if (validation.error) {
      messageEl.textContent = validation.error;
      messageEl.className = 'sp-validation-error';
      messageEl.classList.remove('hidden');
    } else if (validation.warning) {
      messageEl.textContent = validation.warning;
      messageEl.className = 'sp-validation-warning';
      messageEl.classList.remove('hidden');
    } else {
      messageEl.classList.add('hidden');
    }
  }

  /**
   * Display file information
   */
  private displayFileInfo(file: File): void {
    const fileInfoEl = document.getElementById('file-info');
    if (fileInfoEl) {
      fileInfoEl.textContent = `Selected: ${file.name} (${formatFileSize(file.size)})`;
      fileInfoEl.classList.remove('hidden');
    }
  }

  /**
   * Display original image preview
   */
  private displayOriginalPreview(image: ProcessedImage): void {
    const previewImg = document.getElementById('original-preview') as HTMLImageElement;
    const dimensionsEl = document.getElementById('original-dimensions');
    const sizeEl = document.getElementById('original-size');
    const containerEl = document.getElementById('preview-container');

    if (dimensionsEl) {
      dimensionsEl.textContent = `Dimensions: ${image.metadata.width} × ${image.metadata.height}px`;
    }

    if (sizeEl) {
      sizeEl.textContent = `Size: ${formatFileSize(image.metadata.fileSize)}`;
    }

    if (previewImg) {
      const reveal = () => {
        containerEl?.classList.remove('hidden');
      };

      if (previewImg.src === image.originalUrl && previewImg.complete) {
        reveal();
      } else {
        previewImg.onload = reveal;
        previewImg.src = image.originalUrl;
      }
    }
  }

  /**
   * Show processing controls
   */
  private showControls(): void {
    const controlsEl = document.getElementById('processing-controls');
    controlsEl?.classList.remove('controls-inactive');
    controlsEl
      ?.querySelectorAll('input, select, button')
      .forEach((el) => ((el as HTMLInputElement).disabled = false));
  }

  /**
   * Populate default values in controls
   */
  private populateDefaultValues(metadata: { width: number; height: number; format: string }): void {
    const widthInput = document.getElementById('width-input') as HTMLInputElement;
    const heightInput = document.getElementById('height-input') as HTMLInputElement;

    if (widthInput) {
      widthInput.placeholder = `${metadata.width}`;
    }

    if (heightInput) {
      heightInput.placeholder = `${metadata.height}`;
    }
  }

  /**
   * Process the current image with selected options
   */
  private async processCurrentImage(): Promise<void> {
    const currentImage = this.state.images[this.state.selectedIndex];
    if (!currentImage || currentImage.processing) {
      return;
    }

    // Get processing options from UI
    const options = this.getProcessingOptions();

    // Update UI to show processing state
    this.setProcessingState(true);
    this.hideError();

    try {
      // Process the image with progress callback for background removal
      const result = await processImage(
        currentImage.file,
        options,
        options.removeBackground
          ? (progress) => {
              this.updateBackgroundRemovalProgress(progress);
            }
          : undefined
      );

      // Create object URL for processed image
      const processedUrl = URL.createObjectURL(result.blob);
      this.objectUrls.push(processedUrl);

      // Update state
      currentImage.processedUrl = processedUrl;
      currentImage.processing = false;
      currentImage.error = null;

      // Update UI
      this.displayProcessedPreview(result, currentImage);
      this.enableDownload();
      this.setProcessingState(false);
    } catch (error) {
      currentImage.processing = false;
      currentImage.error = error instanceof Error ? error.message : 'Processing failed';
      this.displayError(currentImage.error);
      this.setProcessingState(false);
      console.error('Error processing image:', error);
    }
  }

  /**
   * Update the process button text with background removal progress
   */
  private updateBackgroundRemovalProgress(progress: number): void {
    const processButton = document.getElementById('process-button') as HTMLButtonElement;
    if (processButton && processButton.classList.contains('sp-process-btn-loading')) {
      const percentage = Math.round(progress * 100);
      processButton.innerHTML = `<span class="sp-btn-spinner"></span><span>Loading model ${percentage}%...</span>`;
    }
  }

  /**
   * Get processing options from UI controls
   */
  private getProcessingOptions(): ProcessOptions {
    const widthInput = document.getElementById('width-input') as HTMLInputElement;
    const heightInput = document.getElementById('height-input') as HTMLInputElement;
    const aspectRatioCheckbox = document.getElementById(
      'maintain-aspect-ratio'
    ) as HTMLInputElement;
    const formatSelect = document.getElementById('format-select') as HTMLSelectElement;
    const qualitySlider = document.getElementById('quality-slider') as HTMLInputElement;
    const removeBgCheckbox = document.getElementById(
      'remove-background-checkbox'
    ) as HTMLInputElement;

    const options: ProcessOptions = {};

    // Background removal option
    options.removeBackground = removeBgCheckbox?.checked ?? false;

    // Resize options
    const width = widthInput?.value ? parseInt(widthInput.value, 10) : undefined;
    const height = heightInput?.value ? parseInt(heightInput.value, 10) : undefined;

    if (width || height) {
      options.resize = {
        width,
        height,
        maintainAspectRatio: aspectRatioCheckbox?.checked ?? true,
      };
    }

    // Format option
    if (formatSelect?.value) {
      options.format = formatSelect.value as ImageFormat;
    }

    // Quality option
    if (qualitySlider?.value) {
      options.quality = parseInt(qualitySlider.value, 10) / 100;
    }

    return options;
  }

  /**
   * Set processing state in UI — shows inline spinner in the process button
   */
  private setProcessingState(processing: boolean): void {
    const processButton = document.getElementById('process-button') as HTMLButtonElement;

    if (processButton) {
      processButton.disabled = processing;
      if (processing) {
        processButton.classList.add('sp-process-btn-loading');
        processButton.dataset.originalText = processButton.textContent?.trim() || 'Process Image';
        processButton.innerHTML =
          '<span class="sp-btn-spinner"></span><span>Processing\u2026</span>';
      } else {
        processButton.classList.remove('sp-process-btn-loading');
        processButton.textContent = processButton.dataset.originalText || 'Process Image';
      }
    }
  }

  /**
   * Display processed image preview
   */
  private displayProcessedPreview(
    result: {
      blob: Blob;
      metadata: { width: number; height: number; format: string; fileSize: number };
    },
    originalImage: ProcessedImage
  ): void {
    const previewImg = document.getElementById('processed-preview') as HTMLImageElement;
    const placeholderEl = document.getElementById('processed-placeholder');
    const dimensionsEl = document.getElementById('processed-dimensions');
    const sizeEl = document.getElementById('processed-size');
    const differenceEl = document.getElementById('size-difference');
    const infoEl = document.getElementById('processed-info');

    if (previewImg && originalImage.processedUrl) {
      previewImg.src = originalImage.processedUrl;
      previewImg.classList.remove('hidden');
    }

    if (placeholderEl) {
      placeholderEl.classList.add('hidden');
    }

    if (dimensionsEl) {
      dimensionsEl.textContent = `Dimensions: ${result.metadata.width} × ${result.metadata.height}px`;
    }

    if (sizeEl) {
      sizeEl.textContent = `Size: ${formatFileSize(result.metadata.fileSize)}`;
    }

    if (differenceEl) {
      const difference = result.metadata.fileSize - originalImage.metadata.fileSize;
      const percentChange = ((difference / originalImage.metadata.fileSize) * 100).toFixed(1);
      const sign = difference > 0 ? '+' : '';

      differenceEl.textContent = `Change: ${sign}${formatFileSize(Math.abs(difference))} (${sign}${percentChange}%)`;
      differenceEl.className = difference > 0 ? 'sp-text-increase' : 'sp-text-decrease';
    }

    infoEl?.classList.remove('hidden');
  }

  /**
   * Enable download button
   */
  private enableDownload(): void {
    const downloadButton = document.getElementById('download-button') as HTMLButtonElement;
    const downloadSection = document.getElementById('download-section');

    if (downloadButton) {
      downloadButton.disabled = false;
    }

    downloadSection?.classList.remove('download-inactive');
  }

  /**
   * Download processed image
   */
  private downloadProcessedImage(): void {
    const currentImage = this.state.images[this.state.selectedIndex];
    if (!currentImage?.processedUrl) {
      return;
    }

    // Get the target format from UI or use original
    const formatSelect = document.getElementById('format-select') as HTMLSelectElement;
    const removeBgCheckbox = document.getElementById(
      'remove-background-checkbox'
    ) as HTMLInputElement;

    // If background removal was enabled, force PNG format
    let targetFormat: ImageFormat;
    if (removeBgCheckbox?.checked) {
      targetFormat = 'image/png';
    } else {
      targetFormat = (formatSelect?.value || currentImage.metadata.format) as ImageFormat;
    }

    // Generate filename
    const filename = generateDownloadFilename(currentImage.metadata.fileName, targetFormat);

    // Trigger download
    fetch(currentImage.processedUrl)
      .then((response) => response.blob())
      .then((blob) => {
        createDownloadLink(blob, filename);
      })
      .catch((error) => {
        this.displayError('Failed to download image');
        console.error('Download error:', error);
      });
  }

  /**
   * Display error message
   */
  private displayError(message: string): void {
    const errorContainer = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');

    if (errorText) {
      errorText.textContent = message;
    }

    errorContainer?.classList.remove('hidden');
  }

  /**
   * Hide error message
   */
  private hideError(): void {
    const errorContainer = document.getElementById('error-message');
    errorContainer?.classList.add('hidden');
  }

  /**
   * Cleanup object URLs to prevent memory leaks
   */
  public cleanup(): void {
    this.objectUrls.forEach((url) => URL.revokeObjectURL(url));
    this.objectUrls = [];
  }
}
