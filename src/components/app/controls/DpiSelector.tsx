import { useImageApp } from "@/components/app/state/ImageAppContext";
import { FIELD_LABEL_CLASSES } from "@/components/ui/control";
import InfoTooltip from "@/components/ui/InfoTooltip";
import type { SelectOption } from "@/components/ui/Select";
import Select from "@/components/ui/Select";
import { DPI_OPTIONS } from "@/config/constants";

const dpiOptions: SelectOption[] = DPI_OPTIONS.map((dpi) => ({
  value: String(dpi),
  label: `${dpi} DPI`,
}));

interface DpiSelectorProps {
  idPrefix?: string;
}

export default function DpiSelector(props: DpiSelectorProps) {
  const { state, actions } = useImageApp();
  const prefix = props.idPrefix ?? "";

  return (
    <div>
      <label for={`${prefix}dpi-select`} class={`mb-1.5 block ${FIELD_LABEL_CLASSES}`}>
        Resolution
      </label>
      <Select
        id={`${prefix}dpi-select`}
        ariaLabel={`Resolution: ${state.dpiValue()} DPI`}
        options={dpiOptions}
        value={String(state.dpiValue())}
        onChange={(v) => actions.handleDpiChange(Number(v))}
        disabled={!state.controlsActive()}
      />
      <InfoTooltip
        id={`${prefix}dpi-info-tip`}
        ariaLabel="DPI info"
        content={
          <>
            DPI (dots per inch) sets how many pixels map to one inch. Use <strong>96</strong> for
            screen or digital exports, <strong>300</strong> for print-quality output.
          </>
        }
      />
    </div>
  );
}
