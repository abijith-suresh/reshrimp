import { Show } from "solid-js";
import { useImageApp } from "@/components/app/state/ImageAppContext";
import SectionHeader from "@/components/ui/SectionHeader";

interface QualitySectionProps {
  idPrefix?: string;
}

export default function QualitySection(props: QualitySectionProps) {
  const { state, actions } = useImageApp();
  const qualityId = `${props.idPrefix ?? ""}quality-slider`;
  const qualityHelpId = `${props.idPrefix ?? ""}quality-help`;

  return (
    <div class="flex flex-col gap-3">
      <div class="flex items-center justify-between gap-3">
        <SectionHeader>Quality</SectionHeader>
        {state.qualityControlSupported() ? (
          <span class="text-sm font-semibold text-coral-500">{state.qualityValue()}%</span>
        ) : null}
      </div>
      <label for={qualityId} class="sr-only">
        Quality
      </label>
      <input
        id={qualityId}
        type="range"
        aria-describedby={
          state.controlsActive() && !state.qualityControlSupported() ? qualityHelpId : undefined
        }
        min={1}
        max={100}
        value={state.qualityValue()}
        class="w-full h-1.5 rounded-[3px] appearance-none bg-border-light cursor-pointer slider"
        disabled={!state.controlsActive() || !state.qualityControlSupported()}
        onInput={(e) =>
          actions.handleQualityChange(parseInt((e.target as HTMLInputElement).value, 10))
        }
      />
      <Show when={state.controlsActive() && !state.qualityControlSupported()}>
        <p id={qualityHelpId} class="text-xs leading-relaxed text-muted-foreground m-0">
          Quality applies to JPEG, WebP, and AVIF. PNG stays lossless.
        </p>
      </Show>
    </div>
  );
}
