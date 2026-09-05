import { useImageApp } from "@/components/app/state/ImageAppContext";
import type { SelectOption } from "@/components/ui/Select";
import Select from "@/components/ui/Select";
import { CONVERTIBLE_OUTPUT_FORMATS, getImageFormatLabel } from "@/config/imageFormats";

const formatOptions: SelectOption[] = CONVERTIBLE_OUTPUT_FORMATS.map((format) => ({
  value: format,
  label: getImageFormatLabel(format),
}));

export default function FormatSelect() {
  const { state, actions } = useImageApp();

  return (
    <>
      <label for="format-select" class="sr-only">
        Output format
      </label>
      <Select
        id="format-select"
        options={formatOptions}
        value={state.formatValue()}
        onChange={actions.setFormatValue}
        disabled={!state.controlsActive() || state.formatSelectDisabled()}
      />
    </>
  );
}
