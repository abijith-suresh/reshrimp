import { ImageUp } from "lucide-solid";
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

// The Source card's compact replace control, shown once an image is loaded.
// The first image comes in through the preview's empty state.
export default function UploadDropzone(props: UploadDropzoneProps) {
  return (
    <>
      {/* biome-ignore lint/a11y/useSemanticElements: contains a hidden file input; nesting interactive elements inside a real button would be invalid HTML */}
      <div
        class="flex min-h-14 cursor-pointer touch-manipulation items-center gap-3 rounded-md border border-dashed border-line-strong bg-surface-muted px-3 py-2.5 text-left transition-colors duration-150 hover:border-fg-soft hover:bg-hover data-drag-over:border-primary data-drag-over:bg-coral-subtle"
        data-drag-over={props.isDragOver ? "" : undefined}
        role="button"
        tabIndex={0}
        aria-label="Replace image or drop one here"
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
        <span
          aria-hidden="true"
          class="flex size-9 shrink-0 items-center justify-center rounded-sm border border-line bg-surface text-fg-muted"
        >
          <ImageUp size={18} />
        </span>
        <span class="flex min-w-0 flex-col">
          <span class="text-sm font-semibold text-fg">Replace image</span>
          <span class="text-xs text-fg-muted">or drop one here</span>
        </span>
        {props.children}
      </div>
    </>
  );
}
