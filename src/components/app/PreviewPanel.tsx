import { Show } from "solid-js";
import EmptyState from "@/components/app/preview/EmptyState";
import ErrorDisplay from "@/components/app/preview/ErrorDisplay";
import { useImageApp } from "@/components/app/state/ImageAppContext";
import { UPLOAD_ACCEPT_ATTRIBUTE } from "@/config/imageFormats";

export default function PreviewPanel() {
  const { state, actions } = useImageApp();

  // The empty state's own file input. The Source card has a separate one, so
  // the two never share an ID.
  let emptyStateInputRef: HTMLInputElement | undefined;

  function handleEmptyStateFileChange(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    void actions.handleFileUpload(file);
    (e.target as HTMLInputElement).value = "";
  }

  return (
    <div class="relative flex h-full flex-col overflow-hidden bg-canvas">
      <Show when={!state.currentImage()}>
        <label for="empty-state-file-input" class="sr-only">
          Upload image
        </label>
        <input
          ref={(el) => {
            emptyStateInputRef = el;
          }}
          id="empty-state-file-input"
          type="file"
          class="hidden"
          accept={UPLOAD_ACCEPT_ATTRIBUTE}
          tabIndex={-1}
          onChange={handleEmptyStateFileChange}
        />
        <EmptyState
          validationError={state.validation()?.error}
          validationWarning={state.validation()?.warning}
          onChoose={() => emptyStateInputRef?.click()}
          onDrop={(file) => void actions.handleFileUpload(file)}
        >
          <Show when={state.error()}>{(msg) => <ErrorDisplay message={msg()} />}</Show>
        </EmptyState>
      </Show>

      <Show when={state.currentImage()}>
        {(img) => {
          const displayWidth = () =>
            state.lastCompletedResult()?.metadata.width ?? img().metadata.width;
          const displayHeight = () =>
            state.lastCompletedResult()?.metadata.height ?? img().metadata.height;
          const previewUrl = () => img().processedUrl ?? img().originalUrl;

          return (
            <div class="flex min-h-0 flex-1 flex-col">
              <div class="relative mx-app-preview-gutter mt-app-preview-gutter mb-app-preview-gutter min-h-0 flex-auto max-editor:transition-[margin-bottom] max-editor:duration-150 max-editor:ease-sheet max-editor:group-data-[sheet-state=peek]/app:mb-[calc(var(--spacing-app-sheet-peek)+var(--spacing-app-preview-gutter))] max-editor:group-data-[sheet-state=open]/app:mb-[calc(var(--spacing-app-sheet)+var(--spacing-app-preview-gutter))]">
                <div class="absolute inset-0 flex items-center justify-center overflow-hidden rounded-lg border border-line bg-surface bg-checker shadow-xs">
                  <img
                    id="preview-image"
                    src={previewUrl()}
                    alt="Preview"
                    width={displayWidth()}
                    height={displayHeight()}
                    class="max-h-full max-w-full object-contain"
                  />
                </div>
              </div>

              {/* On phones the error shows in the sheet, beside Download */}
              <Show when={state.error()}>
                {(msg) => (
                  <div class="px-app-preview-gutter pb-app-preview-gutter max-editor:hidden">
                    <ErrorDisplay message={msg()} />
                  </div>
                )}
              </Show>
            </div>
          );
        }}
      </Show>

      <Show when={state.isProcessing() && state.progressLabel()}>
        {(label) => (
          <div
            class="pointer-events-none absolute top-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-2 text-fg shadow-sm"
            role="status"
            aria-live="polite"
          >
            <span
              class="size-2 shrink-0 animate-pulse rounded-full bg-primary"
              aria-hidden="true"
            />
            <span class="whitespace-nowrap text-xs font-medium">{label()}</span>
          </div>
        )}
      </Show>
    </div>
  );
}
