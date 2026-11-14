import { useImageApp } from "@/components/app/state/ImageAppContext";
import UploadDropzone from "@/components/app/upload/UploadDropzone";
import ValidationMessages from "@/components/app/upload/ValidationMessages";
import { UPLOAD_ACCEPT_ATTRIBUTE } from "@/config/imageFormats";

interface UploadAreaProps {
  idPrefix?: string;
}

export default function UploadArea(props: UploadAreaProps) {
  const { state, actions } = useImageApp();
  const fileInputId = `${props.idPrefix ?? ""}file-input`;

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
    <div class="flex flex-col">
      <UploadDropzone
        isDragOver={state.isDragOver()}
        onDragOver={() => actions.setIsDragOver(true)}
        onDragLeave={() => actions.setIsDragOver(false)}
        onDrop={actions.handleFileUpload}
        onClick={handleUploadAreaClick}
        onKeyDown={handleKeyDown}
      >
        <label for={fileInputId} class="sr-only">
          Replace image
        </label>
        <input
          ref={(el) => {
            fileInputRef = el;
          }}
          type="file"
          id={fileInputId}
          accept={UPLOAD_ACCEPT_ATTRIBUTE}
          class="hidden"
          onClick={(e) => e.stopPropagation()}
          onChange={handleFileInput}
        />
      </UploadDropzone>
      <ValidationMessages validation={state.validation()} />
    </div>
  );
}
