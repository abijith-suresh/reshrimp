import AppSlider from "@/components/app/ui/AppSlider";
import { useImageApp } from "@/components/app/state/ImageAppContext";

export default function QualitySection() {
  const { state, actions } = useImageApp();

  return (
    <div class="flex flex-col gap-2.5 border-t border-sp-border-light pt-5">
      <AppSlider
        id="quality-slider"
        label="Quality"
        value={state.qualityValue()}
        onInput={actions.setQualityValue}
        min={0}
        max={100}
        disabled={!state.controlsActive()}
        showValue
      />
    </div>
  );
}
