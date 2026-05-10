import AppSelect from "@/components/shared/AppSelect";
import { FORMAT_OPTIONS } from "@/config/selectOptions";
import { useImageApp } from "@/components/app/state/ImageAppContext";

export default function FormatSelector() {
  const { state, actions } = useImageApp();

  return (
    <AppSelect
      id="format-select"
      options={FORMAT_OPTIONS}
      value={state.formatValue()}
      onChange={actions.setFormatValue}
      disabled={!state.controlsActive() || state.formatSelectDisabled()}
      placeholder="Keep original"
    />
  );
}
