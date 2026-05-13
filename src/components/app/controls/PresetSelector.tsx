import { useImageApp } from "@/components/app/state/ImageAppContext";
import Field from "@/components/ui/Field";
import Select from "@/components/ui/Select";
import { PRESET_OPTIONS } from "@/config/selectOptions";

export default function PresetSelector() {
  const { state, actions } = useImageApp();

  return (
    <Field label="Preset">
      <Select
        id="preset-select"
        options={PRESET_OPTIONS}
        value={state.presetValue()}
        onChange={actions.handlePresetChange}
        disabled={!state.controlsActive()}
        placeholder="Custom"
      />
    </Field>
  );
}
