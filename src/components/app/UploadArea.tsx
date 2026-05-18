import { onCleanup, onMount } from "solid-js";
import UploadDropzone from "@/components/app/upload/UploadDropzone";
import ValidationMessages from "@/components/app/upload/ValidationMessages";
import BatchQueuePanel from "@/components/app/panels/BatchQueuePanel";
import { useImageApp } from "@/components/app/state/ImageAppContext";
import { useBatchQueue } from "@/components/app/state/BatchQueueContext";
import { MAX_FILE_SIZE } from "@/config/constants";
import { UPLOAD_ACCEPT_ATTRIBUTE } from "@/config/imageFormats";
import { formatFileSize, generateId } from "@/utils/imageUtils";
import { extractImageFromPaste } from "@/lib/clipboardUpload";
import { getImageMetadata } from "@/services/imageService";

export default function UploadArea() {
  const { state, actions } = useImageApp();
  const batchQueue = useBatchQueue();

  let fileInputRef: HTMLInputElement | undefined;

  async function handleMultiFileUpload(files: File[]) {
    for (const file of files) {
      try {
        const metadata = await getImageMetadata(file);
        const originalUrl = URL.createObjectURL(file);
        batchQueue.actions.addToQueue({
          id: generateId(),
          file,
          originalUrl,
          processedUrl: null,
          metadata,
          processing: false,
          error: null,
        });
      } catch {
        // Silently skip files that fail to load metadata
      }
    }
  }

  function handleFileInput(e: Event) {
    const target = e.target as HTMLInputElement;
    const files = Array.from(target.files ?? []);
    if (files.length === 1) {
      actions.handleFileUpload(files[0]!);
    } else if (files.length > 1) {
      void handleMultiFileUpload(files);
    }
    target.value = "";
  }

  function handlePaste(e: ClipboardEvent) {
    const file = extractImageFromPaste(e);
    if (file) {
      actions.handleFileUpload(file);
    }
  }

  onMount(() => {
    document.addEventListener("paste", handlePaste);
    onCleanup(() => document.removeEventListener("paste", handlePaste));
  });

  function handleUploadAreaClick() {
    fileInputRef?.click();
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fileInputRef?.click();
    }
  }

  return (
    <div class="flex flex-col gap-4">
      <UploadDropzone
        isDragOver={state.isDragOver()}
        onDragOver={() => actions.setIsDragOver(true)}
        onDragLeave={() => actions.setIsDragOver(false)}
        onDrop={actions.handleFileUpload}
        onClick={handleUploadAreaClick}
        onKeyDown={handleKeyDown}
      >
        <input
          ref={(el) => {
            fileInputRef = el;
          }}
          type="file"
          id="file-input"
          accept={UPLOAD_ACCEPT_ATTRIBUTE}
          class="hidden"
          multiple
          onClick={(e) => e.stopPropagation()}
          onChange={handleFileInput}
        />
        <p class="text-[0.7rem] text-sp-text-soft m-0 mt-1">
          JPEG, PNG, WebP · max {formatFileSize(MAX_FILE_SIZE)}
        </p>
        <ValidationMessages validation={state.validation()} />
      </UploadDropzone>
      <BatchQueuePanel />
    </div>
  );
}
