import AppSelect from "@/components/shared/AppSelect";
import InfoTooltip from "@/components/app/ui/InfoTooltip";
import { DPI_SELECT_OPTIONS } from "@/config/selectOptions";
import { useImageApp } from "@/components/app/state/ImageAppContext";

export default function DpiSelector() {
  const { state, actions } = useImageApp();

  return (
    <div>
      <div class="flex items-center gap-1.5 mb-1">
        <span class="text-[0.8rem] text-sp-text-muted">Resolution</span>
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
      </div>
      <AppSelect
        id="dpi-select"
        options={DPI_SELECT_OPTIONS}
        value={String(state.dpiValue())}
        onChange={(v) => actions.handleDpiChange(Number(v))}
        disabled={!state.controlsActive()}
      />
    </div>
  );
}
