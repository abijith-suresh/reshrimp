import { useImageApp } from "@/components/app/state/ImageAppContext";
import AppSelect from "@/components/shared/AppSelect";
import { FORMAT_OPTIONS } from "@/config/selectOptions";

const PROCESS_FORMAT_OPTIONS = FORMAT_OPTIONS.filter((option) => option.value !== "");

export default function FormatSelect() {
  const { state, actions } = useImageApp();

  return (
    <AppSelect
      id="format-select"
      options={PROCESS_FORMAT_OPTIONS}
      value={state.formatValue()}
      onChange={actions.setFormatValue}
      disabled={!state.controlsActive() || state.formatSelectDisabled()}
    />
  );
}
