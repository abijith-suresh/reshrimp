import { useImageApp } from "@/components/app/state/ImageAppContext";
import SectionHeader from "@/components/ui/SectionHeader";

interface QualitySectionProps {
  idPrefix?: string;
}

export default function QualitySection(props: QualitySectionProps) {
  const { state, actions } = useImageApp();
  const qualityId = `${props.idPrefix ?? ""}quality-slider`;

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
        min={1}
        max={100}
        value={state.qualityValue()}
        class="w-full h-1.5 rounded-[3px] appearance-none bg-border-light cursor-pointer slider"
        disabled={!state.controlsActive() || !state.qualityControlSupported()}
        onInput={(e) => actions.setQualityValue(parseInt((e.target as HTMLInputElement).value, 10))}
      />
    </div>
  );
}
