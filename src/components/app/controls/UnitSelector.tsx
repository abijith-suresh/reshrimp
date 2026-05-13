import { useImageApp } from "@/components/app/state/ImageAppContext";
import ControlField from "@/components/app/ui/ControlField";
import AppSelect from "@/components/shared/AppSelect";
import { UNIT_OPTIONS } from "@/config/selectOptions";
import type { ResizeUnit } from "@/types/processing";

export default function UnitSelector() {
  const { state, actions } = useImageApp();

  return (
    <ControlField label="Unit">
      <AppSelect
        id="unit-select"
        options={UNIT_OPTIONS}
        value={state.resizeUnit()}
        onChange={(v) => actions.handleUnitChange(v as ResizeUnit)}
        disabled={!state.controlsActive()}
      />
    </ControlField>
  );
}
