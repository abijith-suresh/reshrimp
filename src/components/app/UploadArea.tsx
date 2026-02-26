import { Show, type Accessor } from "solid-js";
import type { ProcessedImage, ValidationResult } from "@/types/image";
import { formatFileSize } from "@/utils/imageUtils";
import { MAX_FILE_SIZE } from "@/config/constants";

interface UploadAreaProps {
  isDragOver: Accessor<boolean>;
  onDragOver: () => void;
  onDragLeave: () => void;
  onDrop: (file: File) => void;
  onFileChange: (file: File) => void;
  validation: Accessor<ValidationResult | null>;
  currentImage: Accessor<ProcessedImage | null>;
}

export default function UploadArea(props: UploadAreaProps) {
  let fileInputRef: HTMLInputElement | undefined;

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    props.onDragOver();
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    props.onDragLeave();
    const file = e.dataTransfer?.files[0];
    if (file) props.onDrop(file);
  }

  function handleFileChange(e: Event) {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      props.onFileChange(file);
      // Reset so the same file can be re-selected
      target.value = "";
    }
  }

  function handleUploadAreaClick() {
    fileInputRef?.click();
  }

  return (
    <div class="flex flex-col gap-4">
      <div
        id="upload-area"
        class="bg-sp-bg-card border-2 border-dashed border-sp-border rounded-sp-xl px-5 py-6 text-center cursor-pointer transition-all duration-200 shadow-sp hover:border-sp-lavender"
        classList={{ "sp-drag-active": props.isDragOver() }}
        role="button"
        tabIndex={0}
        aria-label="Upload image or drag and drop"
        onClick={handleUploadAreaClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileInputRef?.click();
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={() => props.onDragLeave()}
        onDrop={handleDrop}
      >
        <input
          ref={(el) => {
            fileInputRef = el;
          }}
          type="file"
          id="file-input"
          accept="image/jpeg,image/png,image/webp,image/gif"
          class="hidden"
          onClick={(e) => e.stopPropagation()}
          onChange={handleFileChange}
        />
        <div class="flex flex-col items-center gap-3">
          <div class="flex flex-col items-center gap-1.5">
            <span class="inline-flex items-center gap-1.5 bg-sp-coral text-white px-5 py-2 rounded-sp-full text-[0.85rem] font-semibold cursor-pointer transition-all duration-200 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(255,111,97,0.3)]">
              <svg
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              Choose file
            </span>
            <span class="text-[0.8rem] text-sp-text-muted">or drag and drop</span>
          </div>
          <p class="text-[0.8rem] text-sp-text-soft m-0">
            JPEG, PNG, WebP, or GIF (max {formatFileSize(MAX_FILE_SIZE)})
          </p>
        </div>

        <Show when={props.currentImage()}>
          {(img) => (
            <div id="file-info" class="mt-3 text-[0.8rem] text-sp-text-muted">
              Selected: {img().file.name} ({formatFileSize(img().file.size)})
            </div>
          )}
        </Show>

        <Show when={props.validation()?.error}>
          {(msg) => <div class="sp-validation-error mt-2">{msg()}</div>}
        </Show>
        <Show when={!props.validation()?.error && props.validation()?.warning}>
          {(msg) => <div class="sp-validation-warning mt-2">{msg()}</div>}
        </Show>
      </div>

      <div id="file-queue" class="hidden" />
    </div>
  );
}
