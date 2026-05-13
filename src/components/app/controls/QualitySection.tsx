import { useImageApp } from "@/components/app/state/ImageAppContext";
import SectionHeader from "@/components/app/ui/SectionHeader";

export default function QualitySection() {
  const { state, actions } = useImageApp();

  return (
    <div class="flex flex-col gap-3">
      <div class="flex items-center justify-between gap-3">
        <SectionHeader>Quality</SectionHeader>
        <span
          class="text-[0.85rem] font-semibold"
          classList={{
            "text-sp-coral": state.qualityControlSupported(),
            "text-sp-text-soft": !state.qualityControlSupported(),
          }}
        >
          {state.qualityControlSupported() ? `${state.qualityValue()}%` : "Fixed"}
        </span>
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
      {state.qualityControlNotice() ? (
        <p class="m-0 text-[0.75rem] leading-5 text-sp-text-soft">{state.qualityControlNotice()}</p>
      ) : null}
    </div>
  );
}
