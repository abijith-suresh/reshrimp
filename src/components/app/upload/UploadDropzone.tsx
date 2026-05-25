import type { JSX } from "solid-js";

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
      class="bg-sp-bg-card border border-sp-border rounded-sp-lg px-4 py-5 text-center cursor-pointer transition-[border-color,box-shadow] duration-200 hover:border-sp-lavender hover:shadow-sp"
      style={{ "touch-action": "manipulation" }}
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
      <div class="flex flex-col items-center gap-2">
        <div class="w-10 h-10 rounded-full border border-sp-border flex items-center justify-center text-sp-text-soft mb-1">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </div>
        <span class="text-[0.8rem] text-sp-text-muted font-medium">Import image or drop</span>
        {props.children}
      </div>
    </div>
  );
}
