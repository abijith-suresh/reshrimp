import { useImageApp } from "@/components/app/state/ImageAppContext";
import type { SelectOption } from "@/components/ui/Select";
import Select from "@/components/ui/Select";
import { CONVERTIBLE_OUTPUT_FORMATS, getImageFormatLabel } from "@/config/imageFormats";

const formatOptions: SelectOption[] = CONVERTIBLE_OUTPUT_FORMATS.map((format) => ({
  value: format,
  label: getImageFormatLabel(format),
}));

interface FormatSelectProps {
  idPrefix?: string;
}

export default function FormatSelect(props: FormatSelectProps) {
  const { state, actions } = useImageApp();
  const formatId = `${props.idPrefix ?? ""}format-select`;

  return (
    <>
      <label for={formatId} class="sr-only">
        Output format
      </label>
      <Select
        id={formatId}
        options={formatOptions}
        value={state.formatValue()}
        onChange={actions.setFormatValue}
        disabled={!state.controlsActive() || state.formatSelectDisabled()}
      />
    </>
  );
}
