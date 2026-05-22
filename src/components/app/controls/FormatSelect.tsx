import { useImageApp } from "@/components/app/state/ImageAppContext";
import Select from "@/components/ui/Select";
import type { SelectOption } from "@/components/ui/Select";
import { CONVERTIBLE_OUTPUT_FORMATS, getImageFormatLabel } from "@/config/imageFormats";

const formatOptions: SelectOption[] = CONVERTIBLE_OUTPUT_FORMATS.map((format) => ({
  value: format,
  label: getImageFormatLabel(format),
}));

export default function FormatSelect() {
  const { state, actions } = useImageApp();

  return (
    <Select
      id="format-select"
      options={formatOptions}
      value={state.formatValue()}
      onChange={actions.setFormatValue}
      disabled={!state.controlsActive() || state.formatSelectDisabled()}
    />
  );
}
