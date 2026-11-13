import { useImageApp } from "@/components/app/state/ImageAppContext";
import { FIELD_LABEL_CLASSES } from "@/components/ui/control";
import type { SelectOption } from "@/components/ui/Select";
import Select from "@/components/ui/Select";
import type { ResizeUnit } from "@/types/processing";

const unitOptions: SelectOption[] = [
  { value: "px", label: "px" },
  { value: "%", label: "%" },
  { value: "in", label: "in" },
  { value: "cm", label: "cm" },
];

interface UnitSelectorProps {
  idPrefix?: string;
}

export default function UnitSelector(props: UnitSelectorProps) {
  const { state, actions } = useImageApp();
  const prefix = props.idPrefix ?? "";

  return (
    <div>
      <label for={`${prefix}unit-select`} class={`mb-1.5 block ${FIELD_LABEL_CLASSES}`}>
        Unit
      </label>
      <Select
        id={`${prefix}unit-select`}
        ariaLabel="Unit"
        options={unitOptions}
        value={state.resizeUnit()}
        onChange={(v) => actions.handleUnitChange(v as ResizeUnit)}
        disabled={!state.controlsActive()}
      />
    </div>
  );
}
