import { useImageApp } from "@/components/app/state/ImageAppContext";
import Field from "@/components/ui/Field";
import InfoTooltip from "@/components/ui/InfoTooltip";
import type { SelectOption } from "@/components/ui/Select";
import Select from "@/components/ui/Select";
import { DPI_OPTIONS } from "@/config/constants";

const dpiOptions: SelectOption[] = DPI_OPTIONS.map((dpi) => ({
  value: String(dpi),
  label: `${dpi} DPI`,
}));

export default function DpiSelector() {
  const { state, actions } = useImageApp();

  return (
    <Field
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
      <Select
        id="dpi-select"
        options={dpiOptions}
        value={String(state.dpiValue())}
        onChange={(v) => actions.handleDpiChange(Number(v))}
        disabled={!state.controlsActive()}
      />
    </Field>
  );
}
