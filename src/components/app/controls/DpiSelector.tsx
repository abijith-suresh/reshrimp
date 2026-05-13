import { useImageApp } from "@/components/app/state/ImageAppContext";
import ControlField from "@/components/app/ui/ControlField";
import InfoTooltip from "@/components/app/ui/InfoTooltip";
import AppSelect from "@/components/shared/AppSelect";
import { DPI_SELECT_OPTIONS } from "@/config/selectOptions";

export default function DpiSelector() {
  const { state, actions } = useImageApp();

  return (
    <ControlField
      label="Resolution"
      labelAccessory={
        <InfoTooltip
          id="dpi-info-tip"
          ariaLabel="DPI info"
          content={
            <>
              DPI (dots per inch) sets how many pixels map to one inch. Use <strong>96</strong> for
              screen or digital exports, <strong>300</strong> for print-quality output.
            </>
          }
          open={state.dpiTooltipOpen()}
          onToggle={actions.setDpiTooltipOpen}
        />
      }
    >
      <AppSelect
        id="dpi-select"
        options={DPI_SELECT_OPTIONS}
        value={String(state.dpiValue())}
        onChange={(v) => actions.handleDpiChange(Number(v))}
        disabled={!state.controlsActive()}
      />
    </ControlField>
  );
}
