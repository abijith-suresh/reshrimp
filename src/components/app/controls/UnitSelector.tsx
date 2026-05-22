import { useImageApp } from "@/components/app/state/ImageAppContext";
import Field from "@/components/ui/Field";
import Select from "@/components/ui/Select";
import type { SelectOption } from "@/components/ui/Select";
import type { ResizeUnit } from "@/types/processing";

const unitOptions: SelectOption[] = [
  { value: "px", label: "px" },
  { value: "%", label: "%" },
  { value: "in", label: "in" },
  { value: "cm", label: "cm" },
];

export default function UnitSelector() {
  const { state, actions } = useImageApp();

  return (
    <Field label="Unit">
      <Select
        id="unit-select"
        options={unitOptions}
        value={state.resizeUnit()}
        onChange={(v) => actions.handleUnitChange(v as ResizeUnit)}
        disabled={!state.controlsActive()}
      />
    </Field>
  );
}
