import { useImageApp } from "@/components/app/state/ImageAppContext";
import { FIELD_LABEL_CLASSES } from "@/components/ui/control";
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
        DPI
      </label>
      <Select
        id={`${prefix}dpi-select`}
        ariaLabel="DPI"
        options={dpiOptions}
        value={String(state.dpiValue())}
        onChange={(v) => actions.handleDpiChange(Number(v))}
        disabled={!state.controlsActive()}
      />
      <p class="mt-1.5 text-xs text-fg-muted">
        Converts inches and cm to pixels. Not saved in the file.
      </p>
    </div>
  );
}
