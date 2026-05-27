import { useImageApp } from "@/components/app/state/ImageAppContext";
import SectionHeader from "@/components/ui/SectionHeader";

export default function QualitySection() {
  const { state, actions } = useImageApp();

  return (
    <div class="flex flex-col gap-3">
      <div class="flex items-center justify-between gap-3">
        <SectionHeader>Quality</SectionHeader>
        {state.qualityControlSupported() ? (
          <span class="text-[0.85rem] font-semibold text-sp-coral">{state.qualityValue()}%</span>
        ) : null}
      </div>
      <label for="quality-slider" class="sr-only">
        Quality
      </label>
      <input
        id="quality-slider"
        type="range"
        min={1}
        max={100}
        value={state.qualityValue()}
        class="w-full h-1.5 rounded-[3px] appearance-none bg-sp-border-light cursor-pointer sp-slider"
        disabled={!state.controlsActive() || !state.qualityControlSupported()}
        onInput={(e) => actions.setQualityValue(parseInt((e.target as HTMLInputElement).value, 10))}
      />
    </div>
  );
}
