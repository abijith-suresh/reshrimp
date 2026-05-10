import AppSelect from "@/components/shared/AppSelect";
import { UNIT_OPTIONS } from "@/config/selectOptions";
import { useImageApp } from "@/components/app/state/ImageAppContext";
import type { ResizeUnit } from "@/types/processing";

export default function UnitSelector() {
  const { state, actions } = useImageApp();

  return (
    <div>
      <span class="block text-[0.8rem] text-sp-text-muted mb-1">Unit</span>
      <AppSelect
        id="unit-select"
        options={UNIT_OPTIONS}
        value={state.resizeUnit()}
        onChange={(v) => actions.handleUnitChange(v as ResizeUnit)}
        disabled={!state.controlsActive()}
      />
    </div>
  );
}
