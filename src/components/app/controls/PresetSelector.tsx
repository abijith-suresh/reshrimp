import AppSelect from "@/components/shared/AppSelect";
import { PRESET_OPTIONS } from "@/config/selectOptions";
import { useImageApp } from "@/components/app/state/ImageAppContext";

export default function PresetSelector() {
  const { state, actions } = useImageApp();

  return (
    <div>
      <span class="block text-[0.8rem] text-sp-text-muted mb-1">Preset</span>
      <AppSelect
        id="preset-select"
        options={PRESET_OPTIONS}
        value={state.presetValue()}
        onChange={actions.handlePresetChange}
        disabled={!state.controlsActive()}
        placeholder="Custom"
      />
    </div>
  );
}
