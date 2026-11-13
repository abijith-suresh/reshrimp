import { ImageUp, ShieldCheck } from "lucide-solid";
import { createSignal, type JSX, Show } from "solid-js";
import { MAX_FILE_SIZE } from "@/config/constants";
import { getSupportedImageFormatSummary } from "@/config/imageFormats";
import { formatFileSize } from "@/utils/imageUtils";

interface EmptyStateProps {
  validationError?: string;
  validationWarning?: string;
  onChoose: () => void;
  onDrop: (file: File) => void;
  /** Extra content under the card, such as a load error. */
  children?: JSX.Element;
}

// The single call to choose or drop the first image, on every screen size.
export default function EmptyState(props: EmptyStateProps) {
  const [dragOver, setDragOver] = createSignal(false);

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: a drop target only; the button inside is the keyboard and pointer control
    <div
      id="sbs-empty-state"
      class="flex flex-1 items-center justify-center overflow-y-auto p-4 editor:p-8"
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer?.files[0];
        if (file) props.onDrop(file);
      }}
    >
      <div class="flex w-full max-w-md flex-col items-center gap-4 text-center">
        <button
          type="button"
          class="group flex w-full cursor-pointer touch-manipulation flex-col items-center gap-1 rounded-lg border-2 border-dashed border-line-strong bg-surface px-6 py-12 transition-colors duration-150 hover:border-fg-soft data-drag-over:border-primary data-drag-over:bg-coral-subtle"
          data-drag-over={dragOver() ? "" : undefined}
          aria-describedby="empty-state-formats"
          onClick={() => props.onChoose()}
        >
          <span
            aria-hidden="true"
            class="mb-3 flex size-12 items-center justify-center rounded-md bg-coral-subtle text-coral-ink transition-transform duration-150 ease-pop group-hover:scale-105"
          >
            <ImageUp size={24} strokeWidth={1.75} />
          </span>
          <span class="font-display text-title-sm text-fg">Choose an image</span>
          <span class="text-sm text-fg-muted">or drop it here</span>
        </button>

        <p id="empty-state-formats" class="text-xs text-fg-muted">
          {getSupportedImageFormatSummary()} · up to {formatFileSize(MAX_FILE_SIZE)}
        </p>

        <Show when={props.validationError}>
          {(message) => (
            <p class="text-sm font-medium text-danger" role="status">
              {message()}
            </p>
          )}
        </Show>

        <Show when={!props.validationError && props.validationWarning}>
          {(message) => (
            <p class="text-sm font-medium text-warning" role="status">
              {message()}
            </p>
          )}
        </Show>

        {props.children}

        <p class="flex items-center gap-1.5 text-xs text-fg-muted">
          <ShieldCheck size={14} class="shrink-0 text-success" aria-hidden="true" />
          Your image stays on this device. Nothing is uploaded.
        </p>
      </div>
    </div>
  );
}
