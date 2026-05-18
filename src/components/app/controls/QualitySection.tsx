import { useImageApp } from "@/components/app/state/ImageAppContext";
import PanelSectionLabel from "@/components/ui/PanelSectionLabel";

export default function QualitySection() {
  const { state, actions } = useImageApp();

  return (
    <div class="flex flex-col gap-3">
      <div class="flex items-center justify-between gap-3">
        <PanelSectionLabel>Quality</PanelSectionLabel>
        {state.qualityControlSupported() ? (
          <span class="text-[0.85rem] font-semibold text-sp-coral">{state.qualityValue()}%</span>
        ) : null}
      </div>
      <input
        id="quality-slider"
        type="range"
        min={1}
        max={100}
        value={state.qualityValue()}
        class="sp-slider w-full"
        disabled={!state.controlsActive() || !state.qualityControlSupported()}
        onInput={(e) => actions.setQualityValue(parseInt((e.target as HTMLInputElement).value, 10))}
      />
    </div>
  );
}
