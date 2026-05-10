import type { JSX } from "solid-js";
import { Upload } from "lucide-solid";

interface UploadDropzoneProps {
  isDragOver: boolean;
  onDragOver: () => void;
  onDragLeave: () => void;
  onDrop: (file: File) => void;
  onClick: () => void;
  onKeyDown: (e: KeyboardEvent) => void;
  children: JSX.Element;
}

export default function UploadDropzone(props: UploadDropzoneProps) {
  return (
    <div
      id="upload-area"
      class="bg-sp-bg-card border-2 border-dashed border-sp-border rounded-sp-xl px-5 py-6 text-center cursor-pointer transition-all duration-200 shadow-sp hover:border-sp-lavender"
      classList={{ "sp-drag-active": props.isDragOver }}
      role="button"
      tabIndex={0}
      aria-label="Upload image or drag and drop"
      onClick={() => props.onClick()}
      onKeyDown={(e) => props.onKeyDown(e)}
      onDragOver={(e) => {
        e.preventDefault();
        props.onDragOver();
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        props.onDragLeave();
      }}
      onDrop={(e) => {
        e.preventDefault();
        props.onDragLeave();
        const file = e.dataTransfer?.files[0];
        if (file) props.onDrop(file);
      }}
    >
      <div class="flex flex-col items-center gap-3">
        <div class="flex flex-col items-center gap-1.5">
          <span class="inline-flex items-center gap-1.5 bg-sp-coral text-white px-5 py-2 rounded-sp-full text-[0.85rem] font-semibold cursor-pointer transition-all duration-200 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(255,111,97,0.3)]">
            <Upload size={16} aria-hidden="true" />
            Choose file
          </span>
          <span class="text-[0.8rem] text-sp-text-muted">or drag and drop</span>
        </div>
        {props.children}
      </div>
    </div>
  );
}
