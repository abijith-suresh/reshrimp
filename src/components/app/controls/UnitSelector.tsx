import { useImageApp } from "@/components/app/state/ImageAppContext";
import Field from "@/components/ui/Field";
import Select from "@/components/ui/Select";
import { UNIT_OPTIONS } from "@/config/selectOptions";
import type { ResizeUnit } from "@/types/processing";

export default function UnitSelector() {
  const { state, actions } = useImageApp();

  return (
    <Field label="Unit">
      <Select
        id="unit-select"
        options={UNIT_OPTIONS}
        value={state.resizeUnit()}
        onChange={(v) => actions.handleUnitChange(v as ResizeUnit)}
        disabled={!state.controlsActive()}
      />
    </Field>
  );
}
