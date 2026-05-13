import { For } from "solid-js";
import { useImageApp } from "@/components/app/state/ImageAppContext";
import { CONVERTIBLE_IMAGE_FORMATS, getImageFormatLabel } from "@/config/imageFormats";

const FORMATS = CONVERTIBLE_IMAGE_FORMATS.map((f) => ({
  value: f,
  label: getImageFormatLabel(f),
}));

export default function FormatPills() {
  const { state, actions } = useImageApp();

  return (
    <div class="flex gap-2">
      <For each={FORMATS}>
        {(fmt) => (
          <button
            type="button"
            class="flex-1 py-2 px-3 rounded-sp-lg text-[0.8rem] font-medium transition-all duration-200 border"
            classList={{
              "bg-sp-coral text-white border-sp-coral shadow-[0_2px_8px_rgba(255,107,107,0.3)]":
                state.formatValue() === fmt.value,
              "bg-sp-bg text-sp-text-muted border-sp-border hover:border-sp-lavender hover:text-sp-lavender-dark":
                state.formatValue() !== fmt.value,
            }}
            disabled={!state.controlsActive() || state.formatSelectDisabled()}
            onClick={() => actions.setFormatValue(fmt.value)}
          >
            {fmt.label}
          </button>
        )}
      </For>
    </div>
  );
}
