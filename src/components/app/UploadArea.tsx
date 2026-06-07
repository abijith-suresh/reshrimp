import UploadDropzone from "@/components/app/upload/UploadDropzone";
import ValidationMessages from "@/components/app/upload/ValidationMessages";
import { useImageApp } from "@/components/app/state/ImageAppContext";
import { MAX_FILE_SIZE } from "@/config/constants";
import { UPLOAD_ACCEPT_ATTRIBUTE } from "@/config/imageFormats";
import { formatFileSize } from "@/utils/imageUtils";

export default function UploadArea() {
  const { state, actions } = useImageApp();

  let fileInputRef: HTMLInputElement | undefined;

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
        <label for="file-input" class="sr-only">
          Upload image
        </label>
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
        <p class="text-xs text-soft-foreground m-0 mt-1">
          JPEG, PNG, WebP · max {formatFileSize(MAX_FILE_SIZE)}
        </p>
        <ValidationMessages validation={state.validation()} />
      </UploadDropzone>
    </div>
  );
}
