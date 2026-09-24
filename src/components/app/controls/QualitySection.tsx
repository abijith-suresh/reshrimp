import { Show } from "solid-js";
import { useImageApp } from "@/components/app/state/ImageAppContext";
import SectionHeader from "@/components/ui/SectionHeader";

interface QualitySectionProps {
  idPrefix?: string;
}

export default function QualitySection(props: QualitySectionProps) {
  const { state, actions } = useImageApp();
  const qualityId = `${props.idPrefix ?? ""}quality-slider`;
  const targetFileSizeId = `${props.idPrefix ?? ""}target-file-size`;
  const qualityModeId = `${props.idPrefix ?? ""}compression-mode-quality`;
  const sizeModeId = `${props.idPrefix ?? ""}compression-mode-size`;
  const modeAvailable = () => state.controlsActive() && state.qualityControlSupported();
  const isQualityMode = () => state.compressionMode() === "quality";

  return (
    <div class="flex flex-col gap-3">
      <SectionHeader>Compression</SectionHeader>

      <fieldset class="relative isolate grid min-w-0 grid-cols-2 rounded-lg bg-background p-1">
        <legend class="sr-only">Compression mode</legend>
        <span
          aria-hidden="true"
          class="pointer-events-none absolute inset-y-1 left-1 z-0 rounded-md bg-card shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
          style={{
            width: "calc(50% - 4px)",
            transform: isQualityMode() ? "translateX(0)" : "translateX(100%)",
          }}
        />
        <button
          id={qualityModeId}
          type="button"
          aria-pressed={state.compressionMode() === "quality"}
          disabled={!modeAvailable()}
          class={`relative z-10 flex min-w-0 items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 ${isQualityMode() ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          onClick={() => actions.setCompressionMode("quality")}
        >
          Quality
        </button>
        <button
          id={sizeModeId}
          type="button"
          aria-pressed={state.compressionMode() === "size"}
          disabled={!modeAvailable()}
          class={`relative z-10 flex min-w-0 items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 ${!isQualityMode() ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          onClick={() => actions.setCompressionMode("size")}
        >
          Max file size
        </button>
      </fieldset>

      <div class="grid">
        <div
          aria-hidden={!isQualityMode()}
          inert={!isQualityMode()}
          class="col-start-1 row-start-1 flex flex-col gap-3 transition-[opacity,transform,visibility] duration-200 ease-out motion-reduce:transition-none"
          style={{
            opacity: isQualityMode() ? "1" : "0",
            visibility: isQualityMode() ? "visible" : "hidden",
            transform: isQualityMode() ? "translateY(0)" : "translateY(4px)",
            "pointer-events": isQualityMode() ? "auto" : "none",
          }}
        >
          <div class="flex min-h-12 items-center justify-between gap-3">
            <label for={qualityId} class="text-sm font-medium text-foreground">
              Output quality
            </label>
            <span class="text-sm font-semibold text-coral-500">{state.qualityValue()}%</span>
          </div>
          <input
            id={qualityId}
            type="range"
            min={1}
            max={100}
            value={state.qualityValue()}
            class="w-full h-1.5 rounded-[3px] appearance-none bg-border-light cursor-pointer slider"
            disabled={!modeAvailable() || !isQualityMode()}
            onInput={(e) =>
              actions.setQualityValue(parseInt((e.target as HTMLInputElement).value, 10))
            }
          />
          <p class="text-xs text-muted-foreground">
            <Show
              when={!state.controlsActive()}
              fallback={
                <Show
                  when={!state.qualityControlSupported()}
                  fallback="Higher quality usually creates a larger file."
                >
                  <Show
                    when={state.removeBackground()}
                    fallback="Choose JPEG, WebP, or AVIF to adjust quality."
                  >
                    Turn off background removal to adjust quality. PNG stays lossless.
                  </Show>
                </Show>
              }
            >
              Upload an image to adjust output quality.
            </Show>
          </p>
        </div>

        <div
          aria-hidden={isQualityMode()}
          inert={isQualityMode()}
          class="col-start-1 row-start-1 flex flex-col gap-3 transition-[opacity,transform,visibility] duration-200 ease-out motion-reduce:transition-none"
          style={{
            opacity: isQualityMode() ? "0" : "1",
            visibility: isQualityMode() ? "hidden" : "visible",
            transform: isQualityMode() ? "translateY(4px)" : "translateY(0)",
            "pointer-events": isQualityMode() ? "none" : "auto",
          }}
        >
          <div class="flex min-h-12 items-center justify-between gap-3">
            <label for={targetFileSizeId} class="text-sm font-medium text-foreground">
              Maximum file size (KB)
            </label>
            <input
              id={targetFileSizeId}
              type="text"
              inputMode="decimal"
              value={state.targetFileSizeValue()}
              placeholder="e.g. 500"
              disabled={!modeAvailable() || isQualityMode()}
              aria-invalid={state.targetFileSizeInputInvalid() ? "true" : undefined}
              aria-describedby={`${targetFileSizeId}-help${state.targetFileSizeInputInvalid() ? ` ${targetFileSizeId}-error` : ""}`}
              class="h-12 w-28 rounded-lg border border-border bg-background px-3 font-body text-base text-foreground transition-[border-color,box-shadow] duration-200 focus-visible:outline-hidden focus-visible:border-lavender-500 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              onInput={(e) => actions.setTargetFileSizeValue(e.currentTarget.value)}
            />
          </div>
          <p id={`${targetFileSizeId}-help`} class="text-xs text-muted-foreground">
            <Show
              when={!state.controlsActive()}
              fallback={
                <Show
                  when={!state.qualityControlSupported()}
                  fallback={
                    state.targetFileSizeValue().trim() === ""
                      ? "Enter a size to let Reshrimp adjust quality automatically."
                      : "Best effort. Quality adjusts automatically to try to stay within this size."
                  }
                >
                  <Show
                    when={state.removeBackground()}
                    fallback="Choose JPEG, WebP, or AVIF to set a size target. PNG stays lossless."
                  >
                    Turn off background removal to target a size. PNG stays lossless.
                  </Show>
                </Show>
              }
            >
              Upload an image to set a size target.
            </Show>
          </p>
          <Show when={state.targetFileSizeInputInvalid()}>
            <p id={`${targetFileSizeId}-error`} role="alert" class="text-xs text-coral-600">
              Enter a size greater than 0 KB.
            </p>
          </Show>
          <Show when={state.targetFileSizeNotice()}>
            {(notice) => (
              <p role="status" aria-live="polite" class="text-xs text-muted-foreground">
                {notice()}
              </p>
            )}
          </Show>
        </div>
      </div>
    </div>
  );
}
