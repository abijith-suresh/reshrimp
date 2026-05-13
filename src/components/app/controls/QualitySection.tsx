import { useImageApp } from "@/components/app/state/ImageAppContext";
import SectionHeader from "@/components/app/ui/SectionHeader";

export default function QualitySection() {
  const { state, actions } = useImageApp();

  return (
    <div class="flex flex-col gap-3">
      <div class="flex items-center justify-between">
        <SectionHeader>Quality</SectionHeader>
        <span class="text-[0.85rem] font-semibold text-sp-coral">{state.qualityValue()}%</span>
      </div>
      <input
        id="quality-slider"
        type="range"
        min={1}
        max={100}
        value={state.qualityValue()}
        class="sp-slider w-full"
        disabled={!state.controlsActive()}
        onInput={(e) => actions.setQualityValue(parseInt((e.target as HTMLInputElement).value, 10))}
      />
    </div>
  );
}
