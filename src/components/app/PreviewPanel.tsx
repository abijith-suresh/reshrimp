import { Show, type Accessor, type Setter } from "solid-js";
import type { ProcessedImage } from "@/types/image";
import type { ProcessResult } from "@/types/processing";
import { formatFileSize } from "@/utils/imageUtils";
import type { SizeDiff } from "./ImageApp";

interface PreviewPanelProps {
  currentImage: Accessor<ProcessedImage | null>;
  processResult: Accessor<ProcessResult | null>;
  activeTab: Accessor<"original" | "processed">;
  setActiveTab: Setter<"original" | "processed">;
  downloadActive: Accessor<boolean>;
  onDownload: () => void;
  error: Accessor<string | null>;
  sizeDifference: Accessor<SizeDiff | null>;
}

export default function PreviewPanel(props: PreviewPanelProps) {
  return (
    <div class="bg-sp-bg-card border border-sp-border rounded-sp-xl shadow-sp overflow-hidden flex flex-col">
      {/* Empty State */}
      <Show when={!props.currentImage()}>
        <div
          id="sbs-empty-state"
          class="flex-1 flex flex-col items-center justify-center text-center p-8 transition-opacity duration-300"
        >
          <svg
            class="w-16 h-16 text-sp-lavender opacity-40 mb-4 animate-float"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p class="font-display text-[1.1rem] font-semibold text-sp-text-soft m-0 mb-1">
            Upload an image to get started
          </p>
          <p class="text-[0.85rem] text-sp-text-soft opacity-70 m-0">
            Your preview will appear here
          </p>
        </div>
      </Show>

      {/* Preview Container */}
      <Show when={props.currentImage()}>
        <div id="preview-container" class="preview-container flex-1 flex-col">
          {/* Tabs */}
          <div class="flex border-b border-sp-border-light px-4 shrink-0">
            <button
              type="button"
              class="sbs-tab"
              classList={{ "sbs-tab-active": props.activeTab() === "original" }}
              data-tab="original"
              onClick={() => props.setActiveTab("original")}
            >
              Original
            </button>
            <button
              type="button"
              class="sbs-tab"
              classList={{ "sbs-tab-active": props.activeTab() === "processed" }}
              data-tab="processed"
              onClick={() => props.setActiveTab("processed")}
            >
              Processed
            </button>
          </div>

          {/* Tab Content */}
          <div class="flex-1 relative min-h-[380px] max-lg:min-h-[300px] max-md:min-h-[250px]">
            {/* Original Tab */}
            <div
              class="tab-panel"
              classList={{ "tab-panel-active": props.activeTab() === "original" }}
              data-tabpanel="original"
            >
              <div class="preview-frame">
                <img
                  id="original-preview"
                  src={props.currentImage()?.originalUrl}
                  alt="Original"
                  class="max-w-full max-h-full object-contain"
                />
              </div>
              <Show when={props.currentImage()}>
                {(img) => (
                  <div id="original-info" class="info-bar">
                    <p id="original-dimensions">
                      Dimensions: {img().metadata.width} &times; {img().metadata.height}px
                    </p>
                    <p id="original-size">Size: {formatFileSize(img().metadata.fileSize)}</p>
                  </div>
                )}
              </Show>
            </div>

            {/* Processed Tab */}
            <div
              class="tab-panel"
              classList={{ "tab-panel-active": props.activeTab() === "processed" }}
              data-tabpanel="processed"
            >
              <div class="preview-frame">
                <Show when={!props.processResult()}>
                  <div id="processed-placeholder" class="text-center text-sp-text-soft p-8">
                    <svg
                      class="w-12 h-12 mx-auto mb-2 text-sp-lavender opacity-50"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="1.5"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <p class="text-[0.85rem] m-0">Process to see result</p>
                  </div>
                </Show>
                <Show when={props.currentImage()?.processedUrl}>
                  {(url) => (
                    <img
                      id="processed-preview"
                      src={url()}
                      alt="Processed"
                      class="max-w-full max-h-full object-contain"
                    />
                  )}
                </Show>
              </div>
              <Show when={props.processResult()}>
                {(result) => (
                  <div id="processed-info" class="info-bar">
                    <p id="processed-dimensions">
                      Dimensions: {result().metadata.width} &times; {result().metadata.height}px
                    </p>
                    <p id="processed-size">Size: {formatFileSize(result().metadata.fileSize)}</p>
                    <Show when={props.sizeDifference()}>
                      {(diff) => (
                        <p id="size-difference" class={diff().className}>
                          {diff().text}
                        </p>
                      )}
                    </Show>
                  </div>
                )}
              </Show>
            </div>
          </div>

          {/* Error */}
          <Show when={props.error()}>
            {(msg) => (
              <div id="error-message" class="error-container">
                <div class="flex gap-3">
                  <svg
                    class="w-5 h-5 text-sp-coral shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <h3 class="text-[0.85rem] font-semibold text-sp-coral-dark m-0 mb-1">
                      Processing Error
                    </h3>
                    <p id="error-text" class="text-[0.8rem] text-sp-coral m-0">
                      {msg()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </Show>

          {/* Download */}
          <div
            id="download-section"
            class="download-section border-t border-sp-border-light p-4 shrink-0"
            classList={{ "download-inactive": !props.downloadActive() }}
          >
            <button
              id="download-button"
              class="download-btn"
              disabled={!props.downloadActive()}
              onClick={props.onDownload}
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              <span>Download</span>
            </button>
          </div>
        </div>
      </Show>
    </div>
  );
}
