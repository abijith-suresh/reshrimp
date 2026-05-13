import { useImageApp } from "@/components/app/state/ImageAppContext";
import ControlField from "@/components/app/ui/ControlField";
import AppSelect from "@/components/shared/AppSelect";
import { PRESET_OPTIONS } from "@/config/selectOptions";

export default function PresetSelector() {
  const { state, actions } = useImageApp();

  return (
    <ControlField label="Preset">
      <AppSelect
        id="preset-select"
        options={PRESET_OPTIONS}
        value={state.presetValue()}
        onChange={actions.handlePresetChange}
        disabled={!state.controlsActive()}
        placeholder="Custom"
      />
    </ControlField>
  );
}
