import type { SelectOption } from "@/components/ui/Select";
import { DPI_OPTIONS } from "./constants";
import { CONVERTIBLE_OUTPUT_FORMATS, getImageFormatLabel } from "./imageFormats";

export const FORMAT_OPTIONS: SelectOption[] = [
  ...CONVERTIBLE_OUTPUT_FORMATS.map((f) => ({
    value: f,
    label: getImageFormatLabel(f),
  })),
];

export const UNIT_OPTIONS: SelectOption[] = [
  { value: "px", label: "px" },
  { value: "%", label: "%" },
  { value: "in", label: "in" },
  { value: "cm", label: "cm" },
];

export const DPI_SELECT_OPTIONS: SelectOption[] = DPI_OPTIONS.map((d) => ({
  value: String(d),
  label: `${d} DPI`,
}));
