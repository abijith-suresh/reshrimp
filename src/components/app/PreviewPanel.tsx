import { Show } from "solid-js";
import EmptyState from "@/components/app/preview/EmptyState";
import ErrorDisplay from "@/components/app/preview/ErrorDisplay";
import ImageInfoBar from "@/components/app/preview/ImageInfoBar";
import { useImageApp } from "@/components/app/state/ImageAppContext";
import { UPLOAD_ACCEPT_ATTRIBUTE } from "@/config/imageFormats";

export default function PreviewPanel() {
  const { state, actions } = useImageApp();

  // Dedicated file input for the EmptyState mobile upload CTA.
  // Keeps it separate from the UploadArea input inside ProcessPanel to
  // avoid duplicate IDs when both are rendered in the DOM.
  let mobileUploadRef: HTMLInputElement | undefined;

  function handleMobileFileChange(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    void actions.handleFileUpload(file);
    (e.target as HTMLInputElement).value = "";
  }

  return (
    <div class="relative h-full flex flex-col bg-background overflow-hidden">
      {/* Hidden file input for the mobile EmptyState upload button */}
      <input
        ref={(el) => {
          mobileUploadRef = el;
        }}
        type="file"
        class="sr-only"
        accept={UPLOAD_ACCEPT_ATTRIBUTE}
        tabIndex={-1}
        aria-hidden="true"
        onChange={handleMobileFileChange}
      />

      <Show when={!state.currentImage()}>
        <EmptyState
          title="Upload an image to get started"
          subtitle="Your preview will appear here"
          validationError={state.validation()?.error}
          validationWarning={state.validation()?.warning}
          onUploadClick={() => mobileUploadRef?.click()}
        />
      </Show>

      <Show when={state.currentImage()}>
        {(img) => {
          const displayWidth = () =>
            state.lastCompletedResult()?.metadata.width ?? img().metadata.width;
          const displayHeight = () =>
            state.lastCompletedResult()?.metadata.height ?? img().metadata.height;
          const displayFileSize = () =>
            state.lastCompletedResult()?.metadata.fileSize ?? img().metadata.fileSize;
          const previewUrl = () => img().processedUrl ?? img().originalUrl;

          return (
            <div class="flex-1 flex flex-col min-h-0">
              <div class="flex-1 relative min-h-0 m-3 mb-0">
                <div class="absolute inset-0 preview-frame">
                  <img
                    id="preview-image"
                    src={previewUrl()}
                    alt="Preview"
                    width={displayWidth()}
                    height={displayHeight()}
                    class="max-w-full max-h-full object-contain"
                  />
                </div>
              </div>

              {/* Info strip — desktop only; on mobile it lives in the snap-sheet mini header */}
              <div class="shrink-0 px-4 py-3 hidden md:block">
                <ImageInfoBar
                  fileName={img().metadata.fileName}
                  width={displayWidth()}
                  height={displayHeight()}
                  fileSize={displayFileSize()}
                  sizeDiff={state.sizeDifference()}
                />
              </div>

              <Show when={state.error()}>
                {(msg) => (
                  <div class="px-4 pb-3">
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
            class="pointer-events-none absolute top-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border border-border-light bg-card px-3.5 py-2 text-foreground shadow-sm"
            role="status"
            aria-live="polite"
          >
            <span class="h-2 w-2 shrink-0 rounded-full bg-coral-500" aria-hidden="true" />
            <span class="text-xs font-medium whitespace-nowrap">{label()}</span>
          </div>
        )}
      </Show>
    </div>
  );
}
