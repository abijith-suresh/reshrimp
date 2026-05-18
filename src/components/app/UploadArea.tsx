import { onCleanup, onMount } from "solid-js";
import UploadDropzone from "@/components/app/upload/UploadDropzone";
import ValidationMessages from "@/components/app/upload/ValidationMessages";
import { useImageApp } from "@/components/app/state/ImageAppContext";
import { MAX_FILE_SIZE } from "@/config/constants";
import { UPLOAD_ACCEPT_ATTRIBUTE } from "@/config/imageFormats";
import { formatFileSize } from "@/utils/imageUtils";
import { extractImageFromPaste } from "@/lib/clipboardUpload";

export default function UploadArea() {
  const { state, actions } = useImageApp();

  let fileInputRef: HTMLInputElement | undefined;

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

  function handleFileInput(e: Event) {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      actions.handleFileUpload(file);
      target.value = "";
    }
  }

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
          onClick={(e) => e.stopPropagation()}
          onChange={handleFileInput}
        />
        <p class="text-[0.7rem] text-sp-text-soft m-0 mt-1">
          JPEG, PNG, WebP · max {formatFileSize(MAX_FILE_SIZE)}
        </p>
        <ValidationMessages validation={state.validation()} />
      </UploadDropzone>
    </div>
  );
}
