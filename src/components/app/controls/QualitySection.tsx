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

  return (
    <div class="flex flex-col gap-3">
      <div class="flex items-center justify-between gap-3">
        <SectionHeader>Quality</SectionHeader>
        {state.qualityControlSupported() && !state.targetFileSizeValue().trim() ? (
          <span class="text-sm font-semibold text-coral-500">{state.qualityValue()}%</span>
        ) : null}
      </div>

      <div class="flex items-center justify-between gap-3">
        <label for={targetFileSizeId} class="text-sm font-medium text-foreground">
          Max file size (KB)
        </label>
        <input
          id={targetFileSizeId}
          type="text"
          inputMode="decimal"
          value={state.targetFileSizeValue()}
          placeholder="e.g. 500"
          disabled={!state.controlsActive() || !state.qualityControlSupported()}
          aria-invalid={state.targetFileSizeInputInvalid() ? "true" : undefined}
          aria-describedby={`${targetFileSizeId}-help${state.targetFileSizeInputInvalid() ? ` ${targetFileSizeId}-error` : ""}`}
          class="w-28 px-3 py-2.5 border border-border rounded-lg font-body text-base text-foreground bg-background transition-[border-color,box-shadow] duration-200 focus-visible:outline-hidden focus-visible:border-lavender-500 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          onInput={(e) => actions.setTargetFileSizeValue(e.currentTarget.value)}
        />
      </div>
      <p id={`${targetFileSizeId}-help`} class="text-xs text-muted-foreground">
        <Show
          when={!state.controlsActive()}
          fallback={
            <Show
              when={!state.qualityControlSupported()}
              fallback="Best effort. Quality adjusts automatically to try to stay within this size."
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

      <label for={qualityId} class="sr-only">
        Quality
      </label>
      <input
        id={qualityId}
        type="range"
        min={1}
        max={100}
        value={state.qualityValue()}
        class="w-full h-1.5 rounded-[3px] appearance-none bg-border-light cursor-pointer slider"
        disabled={
          !state.controlsActive() ||
          !state.qualityControlSupported() ||
          state.targetFileSizeValue().trim() !== ""
        }
        onInput={(e) => actions.setQualityValue(parseInt((e.target as HTMLInputElement).value, 10))}
      />
    </div>
  );
}
