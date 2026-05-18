import { createSignal, Show } from "solid-js";
import EmptyState from "@/components/app/preview/EmptyState";
import ImageInfoBar from "@/components/app/preview/ImageInfoBar";
import ErrorDisplay from "@/components/app/preview/ErrorDisplay";
import { useImageApp } from "@/components/app/state/ImageAppContext";

export default function PreviewPanel() {
  const { state } = useImageApp();
  const [showOriginal, setShowOriginal] = createSignal(false);

  return (
    <div class="h-full flex flex-col bg-sp-bg overflow-hidden">
      <Show when={!state.currentImage()}>
        <EmptyState
          title="Upload an image to get started"
          subtitle="Your preview will appear here"
        />
      </Show>

      <Show when={state.currentImage()}>
        {(img) => {
          const displayWidth = () => state.processResult()?.metadata.width ?? img().metadata.width;
          const displayHeight = () =>
            state.processResult()?.metadata.height ?? img().metadata.height;
          const displayFileSize = () =>
            state.processResult()?.metadata.fileSize ?? img().metadata.fileSize;
          const previewUrl = () =>
            showOriginal() ? img().originalUrl : (img().processedUrl ?? img().originalUrl);

          return (
            <div class="flex-1 flex flex-col min-h-0">
              <div class="flex-1 relative min-h-0 m-3 mb-0">
                <div class="absolute inset-0 preview-frame">
                  <img
                    id="preview-image"
                    src={previewUrl()}
                    alt="Preview"
                    class="max-w-full max-h-full object-contain"
                  />

                  <Show when={state.isProcessing() && state.progressLabel()}>
                    {(label) => (
                      <div class="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-sp-bg/80 rounded-sp">
                        <span class="sp-btn-spinner" aria-hidden="true" />
                        <span class="text-[0.8rem] text-sp-text-muted font-medium">{label()}</span>
                      </div>
                    )}
                  </Show>
                </div>
              </div>

              {/* Info strip — fixed height, always present */}
              <div class="shrink-0 px-4 py-3">
                <Show when={img().processedUrl}>
                  <div class="flex justify-center mb-2">
                    <button
                      type="button"
                      class="text-[0.75rem] font-medium px-3 py-1 rounded-sp-full border border-sp-border bg-sp-bg-card text-sp-text-muted hover:border-sp-coral hover:text-sp-coral transition-colors"
                      onClick={() => setShowOriginal((v) => !v)}
                    >
                      {showOriginal() ? "Show processed" : "Compare original"}
                    </button>
                  </div>
                </Show>
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
    </div>
  );
}
