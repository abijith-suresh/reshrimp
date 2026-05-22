import { useImageApp } from "@/components/app/state/ImageAppContext";
import Select from "@/components/ui/Select";
import { FORMAT_OPTIONS } from "@/config/selectOptions";

export default function FormatSelect() {
  const { state, actions } = useImageApp();

  return (
    <Select
      id="format-select"
      options={FORMAT_OPTIONS}
      value={state.formatValue()}
      onChange={actions.setFormatValue}
      disabled={!state.controlsActive() || state.formatSelectDisabled()}
    />
  );
}
