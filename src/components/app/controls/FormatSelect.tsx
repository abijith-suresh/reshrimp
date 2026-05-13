import AppSelect from "@/components/shared/AppSelect";
import { useImageApp } from "@/components/app/state/ImageAppContext";
import { CONVERTIBLE_IMAGE_FORMATS, getImageFormatLabel } from "@/config/imageFormats";

const FORMAT_OPTIONS = CONVERTIBLE_IMAGE_FORMATS.map((f) => ({
  value: f,
  label: getImageFormatLabel(f),
}));

export default function FormatSelect() {
  const { state, actions } = useImageApp();

  return (
    <AppSelect
      id="format-select"
      options={FORMAT_OPTIONS}
      value={state.formatValue()}
      onChange={actions.setFormatValue}
      disabled={!state.controlsActive() || state.formatSelectDisabled()}
    />
  );
}
