import { Show } from "solid-js";
import { useImageApp } from "@/components/app/state/ImageAppContext";
import { CONTROL_CLASSES, FIELD_LABEL_CLASSES } from "@/components/ui/control";

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
  const targetMissed = () => state.processResult()?.metadata.targetFileSizeStatus === "unmet";
  const segmentClasses =
    "relative z-10 flex min-w-0 items-center justify-center rounded-sm px-3 text-sm font-medium transition-colors duration-150 disabled:cursor-not-allowed";

  return (
    <div class="flex flex-col gap-3">
      <fieldset class="min-w-0">
        <legend class={`mb-1.5 ${FIELD_LABEL_CLASSES}`}>Compression</legend>
        <div
          class="relative isolate grid h-10 grid-cols-2 rounded-md border border-line-strong bg-canvas p-0.5 transition-opacity duration-150 pointer-coarse:h-11"
          classList={{ "opacity-50": !modeAvailable() }}
        >
          <span
            aria-hidden="true"
            class="pointer-events-none absolute inset-y-0.5 left-0.5 right-1/2 z-0 rounded-sm bg-surface shadow-button transition-[translate] duration-150 ease-reveal motion-reduce:transition-none data-[mode=size]:translate-x-full"
            data-mode={state.compressionMode()}
          />
          <button
            id={qualityModeId}
            type="button"
            aria-pressed={state.compressionMode() === "quality"}
            disabled={!modeAvailable()}
            class={`${segmentClasses} ${isQualityMode() ? "text-fg" : "text-fg-muted hover:text-fg"}`}
            onClick={() => actions.setCompressionMode("quality")}
          >
            Quality
          </button>
          <button
            id={sizeModeId}
            type="button"
            aria-pressed={state.compressionMode() === "size"}
            disabled={!modeAvailable()}
            class={`${segmentClasses} ${!isQualityMode() ? "text-fg" : "text-fg-muted hover:text-fg"}`}
            onClick={() => actions.setCompressionMode("size")}
          >
            Max file size
          </button>
        </div>
      </fieldset>

      <div class="grid">
        <div
          aria-hidden={!isQualityMode()}
          inert={!isQualityMode()}
          class="col-start-1 row-start-1 flex flex-col gap-3 transition-[opacity,transform,translate,visibility] duration-200 ease-out motion-reduce:transition-none aria-hidden:opacity-0 aria-hidden:invisible aria-hidden:translate-y-1 aria-hidden:pointer-events-none"
        >
          <div class="flex min-h-11 items-center justify-between gap-3">
            <label for={qualityId} class="text-sm font-medium text-fg">
              Output quality
            </label>
            <span class="text-sm font-semibold text-fg tabular-nums">{state.qualityValue()}%</span>
          </div>
          <input
            id={qualityId}
            type="range"
            min={1}
            max={100}
            value={state.qualityValue()}
            class="slider h-1.5 w-full cursor-pointer appearance-none rounded-full disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              background: `linear-gradient(to right, var(--color-primary) ${state.qualityValue()}%, var(--color-line-strong) ${state.qualityValue()}%)`,
            }}
            disabled={!modeAvailable() || !isQualityMode()}
            onInput={(e) =>
              actions.setQualityValue(parseInt((e.target as HTMLInputElement).value, 10))
            }
          />
          <p class="text-xs text-fg-muted">
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
          class="col-start-1 row-start-1 flex flex-col gap-3 transition-[opacity,transform,translate,visibility] duration-200 ease-out motion-reduce:transition-none aria-hidden:opacity-0 aria-hidden:invisible aria-hidden:translate-y-1 aria-hidden:pointer-events-none"
        >
          <div class="flex min-h-11 items-center justify-between gap-3">
            <label for={targetFileSizeId} class="text-sm font-medium text-fg">
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
              class={`w-28 ${CONTROL_CLASSES}`}
              onInput={(e) => actions.setTargetFileSizeValue(e.currentTarget.value)}
            />
          </div>
          <p id={`${targetFileSizeId}-help`} class="text-xs text-fg-muted">
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
            <p id={`${targetFileSizeId}-error`} role="alert" class="text-xs text-danger">
              Enter a size greater than 0 KB.
            </p>
          </Show>
          <Show when={state.targetFileSizeNotice()}>
            {(notice) => (
              <p
                role="status"
                aria-live="polite"
                class={`text-xs ${targetMissed() ? "font-medium text-warning" : "text-fg-muted"}`}
              >
                {notice()}
              </p>
            )}
          </Show>
        </div>
      </div>
    </div>
  );
}
