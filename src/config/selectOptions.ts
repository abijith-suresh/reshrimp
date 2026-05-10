import type { AppSelectOption } from "@/components/shared/AppSelect";
import { DPI_OPTIONS } from "./constants";
import { CONVERTIBLE_IMAGE_FORMATS, getImageFormatLabel } from "./imageFormats";
import { SOCIAL_MEDIA_PRESETS } from "./presets";

export const FORMAT_OPTIONS: AppSelectOption[] = [
  { value: "", label: "Keep original" },
  ...CONVERTIBLE_IMAGE_FORMATS.map((f) => ({
    value: f,
    label: getImageFormatLabel(f),
  })),
];

export const PRESET_OPTIONS: AppSelectOption[] = [
  { value: "", label: "Custom" },
  ...SOCIAL_MEDIA_PRESETS.map((p) => ({ value: p.label, label: p.label })),
];

export const UNIT_OPTIONS: AppSelectOption[] = [
  { value: "px", label: "px" },
  { value: "%", label: "%" },
  { value: "in", label: "in" },
  { value: "cm", label: "cm" },
];

export const DPI_SELECT_OPTIONS: AppSelectOption[] = DPI_OPTIONS.map((d) => ({
  value: String(d),
  label: `${d} DPI`,
}));
