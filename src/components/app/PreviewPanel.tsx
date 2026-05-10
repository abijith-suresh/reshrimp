import { Show } from "solid-js";
import EmptyState from "@/components/app/preview/EmptyState";
import ImageTabs from "@/components/app/preview/ImageTabs";
import ImagePreview from "@/components/app/preview/ImagePreview";
import ImageInfoBar from "@/components/app/preview/ImageInfoBar";
import SizeDiffBadge from "@/components/app/preview/SizeDiffBadge";
import ErrorDisplay from "@/components/app/preview/ErrorDisplay";
import DownloadSection from "@/components/app/preview/DownloadSection";
import { useImageApp } from "@/components/app/state/ImageAppContext";

export default function PreviewPanel() {
  const { state, actions } = useImageApp();

  return (
    <div class="bg-sp-bg-card border border-sp-border rounded-sp-xl shadow-sp overflow-hidden flex flex-col">
      <Show when={!state.currentImage()}>
        <EmptyState
          title="Upload an image to get started"
          subtitle="Your preview will appear here"
        />
      </Show>

      <Show when={state.currentImage()}>
        {(img) => (
          <div id="preview-container" class="preview-container flex-1 flex-col">
            <ImageTabs activeTab={state.activeTab()} onTabChange={actions.setActiveTab} />

            <div class="flex-1 relative min-h-[380px] max-lg:min-h-[300px] max-md:min-h-[250px]">
              <div
                id="original-panel"
                class="tab-panel"
                classList={{ "tab-panel-active": state.activeTab() === "original" }}
                role="tabpanel"
                aria-labelledby="original-tab"
              >
                <ImagePreview id="original-preview" src={img().originalUrl} alt="Original" />
                <ImageInfoBar
                  width={img().metadata.width}
                  height={img().metadata.height}
                  fileSize={img().metadata.fileSize}
                />
              </div>

              <div
                id="processed-panel"
                class="tab-panel"
                classList={{ "tab-panel-active": state.activeTab() === "processed" }}
                role="tabpanel"
                aria-labelledby="processed-tab"
              >
                <Show
                  when={state.processResult() && img().processedUrl}
                  fallback={
                    <div id="processed-placeholder" class="text-center text-sp-text-soft p-8">
                      <p class="text-[0.85rem] m-0">Process to see result</p>
                    </div>
                  }
                >
                  <ImagePreview id="processed-preview" src={img().processedUrl!} alt="Processed" />
                </Show>
                <Show when={state.processResult()}>
                  {(result) => (
                    <div id="processed-info" class="info-bar">
                      <ImageInfoBar
                        width={result().metadata.width}
                        height={result().metadata.height}
                        fileSize={result().metadata.fileSize}
                        metadataNote="EXIF metadata removed"
                      />
                      <SizeDiffBadge diff={state.sizeDifference()} />
                    </div>
                  )}
                </Show>
              </div>
            </div>

            <Show when={state.error()}>{(msg) => <ErrorDisplay message={msg()} />}</Show>

            <DownloadSection />
          </div>
        )}
      </Show>
    </div>
  );
}
