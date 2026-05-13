import { Show } from "solid-js";
import EmptyState from "@/components/app/preview/EmptyState";
import ImageInfoBar from "@/components/app/preview/ImageInfoBar";
import ErrorDisplay from "@/components/app/preview/ErrorDisplay";
import { useImageApp } from "@/components/app/state/ImageAppContext";

export default function PreviewPanel() {
  const { state } = useImageApp();

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
          // Use processed metadata if available, otherwise original
          const displayWidth = () => state.processResult()?.metadata.width ?? img().metadata.width;
          const displayHeight = () =>
            state.processResult()?.metadata.height ?? img().metadata.height;
          const displayFileSize = () =>
            state.processResult()?.metadata.fileSize ?? img().metadata.fileSize;

          return (
            <div class="flex-1 flex flex-col min-h-0">
              {/* Image viewport — absolute positioning guarantees viewport constraint */}
              <div class="flex-1 relative min-h-0 m-3 mb-0">
                <div class="absolute inset-0 preview-frame">
                  {/*
                    Two-image stacking approach: the original image always stays
                    rendered underneath, so there's never a frame with no visible
                    content when the processed result arrives. The processed image
                    is layered on top using absolute positioning.
                  */}
                  <img
                    src={img().originalUrl}
                    alt=""
                    class="max-w-full max-h-full object-contain"
                    aria-hidden="true"
                  />
                  <Show when={img().processedUrl}>
                    {(processedUrl) => (
                      <img
                        id="preview-image"
                        src={processedUrl()}
                        alt="Preview"
                        class="absolute inset-0 max-w-full max-h-full object-contain m-auto"
                      />
                    )}
                  </Show>

                  {/* Heavy processing overlay (background removal) */}
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
