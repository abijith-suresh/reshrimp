import { Show, onMount, onCleanup, type Accessor, type Setter } from "solid-js";
import type { ResizeUnit } from "@/types/processing";
import { DPI_OPTIONS } from "@/config/constants";
import { SOCIAL_MEDIA_PRESETS } from "@/config/presets";
import AppSelect, { type AppSelectOption } from "@/components/shared/AppSelect";

interface ProcessingControlsProps {
  controlsActive: Accessor<boolean>;
  widthValue: Accessor<string>;
  setWidthValue: (val: string) => void;
  heightValue: Accessor<string>;
  setHeightValue: (val: string) => void;
  maintainAspectRatio: Accessor<boolean>;
  onAspectRatioChange: (checked: boolean) => void;
  removeBackground: Accessor<boolean>;
  onRemoveBackgroundChange: (checked: boolean) => void;
  formatValue: Accessor<string>;
  setFormatValue: Setter<string>;
  formatSelectDisabled: Accessor<boolean>;
  qualityValue: Accessor<number>;
  setQualityValue: Setter<number>;
  tooltipOpen: Accessor<boolean>;
  setTooltipOpen: Setter<boolean>;
  isProcessing: Accessor<boolean>;
  processBtnLabel: Accessor<string>;
  onProcess: () => void;
  widthPlaceholder: Accessor<string>;
  heightPlaceholder: Accessor<string>;
  // Resize unit
  resizeUnit: Accessor<ResizeUnit>;
  onUnitChange: (unit: ResizeUnit) => void;
  // DPI (only relevant when unit is 'in' or 'cm')
  dpiValue: Accessor<number>;
  onDpiChange: (dpi: number) => void;
  dpiTooltipOpen: Accessor<boolean>;
  setDpiTooltipOpen: Setter<boolean>;
  // Preset
  presetValue: Accessor<string>;
  onPresetChange: (label: string) => void;
}

const FORMAT_OPTIONS: AppSelectOption[] = [
  { value: "", label: "Keep original" },
  { value: "image/jpeg", label: "JPEG" },
  { value: "image/png", label: "PNG" },
  { value: "image/webp", label: "WebP" },
];

const PRESET_OPTIONS: AppSelectOption[] = [
  { value: "", label: "Custom" },
  ...SOCIAL_MEDIA_PRESETS.map((p) => ({ value: p.label, label: p.label })),
];

const UNIT_OPTIONS: AppSelectOption[] = [
  { value: "px", label: "px" },
  { value: "%", label: "%" },
  { value: "in", label: "in" },
  { value: "cm", label: "cm" },
];

const DPI_SELECT_OPTIONS: AppSelectOption[] = DPI_OPTIONS.map((d) => ({
  value: String(d),
  label: `${d} DPI`,
}));

export default function ProcessingControls(props: ProcessingControlsProps) {
  // Close background-removal tooltip when clicking outside
  onMount(() => {
    const handler = () => props.setTooltipOpen(false);
    document.addEventListener("click", handler);
    onCleanup(() => document.removeEventListener("click", handler));
  });

  // Close DPI tooltip when clicking outside
  onMount(() => {
    const handler = () => props.setDpiTooltipOpen(false);
    document.addEventListener("click", handler);
    onCleanup(() => document.removeEventListener("click", handler));
  });

  const showDpi = () => props.resizeUnit() === "in" || props.resizeUnit() === "cm";

  return (
    <div
      id="processing-controls"
      class="bg-sp-bg-card border border-sp-border rounded-sp-xl p-6 shadow-sp flex flex-col gap-5 flex-1 transition-[opacity,filter] duration-400 ease-in-out"
      classList={{ "controls-inactive": !props.controlsActive() }}
    >
      {/* Resize */}
      <div class="flex flex-col gap-2.5">
        <h4 class="text-[0.8rem] font-semibold text-sp-text m-0 uppercase tracking-wider">
          Resize
        </h4>

        {/* Presets */}
        <div>
          <span class="block text-[0.8rem] text-sp-text-muted mb-1">Preset</span>
          <AppSelect
            id="preset-select"
            options={PRESET_OPTIONS}
            value={props.presetValue()}
            onChange={props.onPresetChange}
            disabled={!props.controlsActive()}
            placeholder="Custom"
          />
        </div>

        {/* Width / Height inputs */}
        <div class="grid grid-cols-2 gap-3">
          <label class="block">
            <span class="block text-[0.8rem] text-sp-text-muted mb-1">Width</span>
            <input
              type="number"
              id="width-input"
              class="w-full px-3 py-2 border border-sp-border rounded-sp font-body text-[0.85rem] text-sp-text bg-sp-bg transition-[border-color,box-shadow] duration-200 focus:outline-none focus:border-sp-lavender focus:shadow-[0_0_0_3px_rgba(167,139,250,0.15)]"
              min="0.001"
              max="100000"
              step="any"
              placeholder={props.widthPlaceholder()}
              disabled={!props.controlsActive()}
              value={props.widthValue()}
              onInput={(e) => props.setWidthValue((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="block text-[0.8rem] text-sp-text-muted mb-1">Height</span>
            <input
              type="number"
              id="height-input"
              class="w-full px-3 py-2 border border-sp-border rounded-sp font-body text-[0.85rem] text-sp-text bg-sp-bg transition-[border-color,box-shadow] duration-200 focus:outline-none focus:border-sp-lavender focus:shadow-[0_0_0_3px_rgba(167,139,250,0.15)]"
              min="0.001"
              max="100000"
              step="any"
              placeholder={props.heightPlaceholder()}
              disabled={!props.controlsActive()}
              value={props.heightValue()}
              onInput={(e) => props.setHeightValue((e.target as HTMLInputElement).value)}
            />
          </label>
        </div>

        {/* Unit selector */}
        <div>
          <span class="block text-[0.8rem] text-sp-text-muted mb-1">Unit</span>
          <AppSelect
            id="unit-select"
            options={UNIT_OPTIONS}
            value={props.resizeUnit()}
            onChange={(v) => props.onUnitChange(v as ResizeUnit)}
            disabled={!props.controlsActive()}
          />
        </div>

        {/* DPI selector — only shown for physical units */}
        <Show when={showDpi()}>
          <div>
            <div class="flex items-center gap-1.5 mb-1">
              <span class="text-[0.8rem] text-sp-text-muted">Resolution</span>
              <span id="dpi-info-tip" class="relative">
                <button
                  type="button"
                  id="dpi-info-icon"
                  class="info-icon"
                  aria-label="DPI info"
                  onClick={(e) => {
                    e.stopPropagation();
                    props.setDpiTooltipOpen((v) => !v);
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </button>
                <span
                  id="dpi-tooltip"
                  class="info-tooltip"
                  classList={{ active: props.dpiTooltipOpen() }}
                  role="tooltip"
                >
                  DPI (dots per inch) sets how many pixels map to one inch. Use <strong>96</strong>{" "}
                  for screen or digital exports, <strong>300</strong> for print-quality output.
                </span>
              </span>
            </div>
            <AppSelect
              id="dpi-select"
              options={DPI_SELECT_OPTIONS}
              value={String(props.dpiValue())}
              onChange={(v) => props.onDpiChange(Number(v))}
              disabled={!props.controlsActive()}
            />
          </div>
        </Show>

        {/* Aspect ratio lock */}
        <label class="flex items-center gap-2 text-[0.8rem] text-sp-text-muted cursor-pointer">
          <input
            type="checkbox"
            id="maintain-aspect-ratio"
            checked={props.maintainAspectRatio()}
            disabled={!props.controlsActive()}
            class="w-4 h-4 accent-sp-lavender cursor-pointer"
            onChange={(e) => props.onAspectRatioChange((e.target as HTMLInputElement).checked)}
          />
          <span>Lock aspect ratio</span>
        </label>
      </div>

      {/* Background Removal */}
      <div class="flex flex-col gap-2.5 border-t border-sp-border-light pt-5">
        <h4 class="text-[0.8rem] font-semibold text-sp-text m-0 uppercase tracking-wider">
          Background Removal
        </h4>
        <div class="flex items-center gap-2">
          <label class="flex items-center gap-2 text-[0.85rem] text-sp-text cursor-pointer">
            <input
              type="checkbox"
              id="remove-background-checkbox"
              checked={props.removeBackground()}
              disabled={!props.controlsActive()}
              class="w-4 h-4 accent-sp-lavender cursor-pointer"
              onChange={(e) =>
                props.onRemoveBackgroundChange((e.target as HTMLInputElement).checked)
              }
            />
            <span>Remove background</span>
          </label>
          <Show when={props.removeBackground()}>
            <span id="bg-removal-info-tip" class="relative">
              <button
                type="button"
                id="bg-removal-info-icon"
                class="info-icon"
                aria-label="Background removal info"
                onClick={(e) => {
                  e.stopPropagation();
                  props.setTooltipOpen((v) => !v);
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              </button>
              <span
                id="bg-removal-tooltip"
                class="info-tooltip"
                classList={{ active: props.tooltipOpen() }}
                role="tooltip"
              >
                Format is fixed to PNG to preserve transparency. First run may take a moment while
                the model loads.
              </span>
            </span>
          </Show>
        </div>
      </div>

      {/* Format */}
      <div class="flex flex-col gap-2.5 border-t border-sp-border-light pt-5">
        <h4 class="text-[0.8rem] font-semibold text-sp-text m-0 uppercase tracking-wider">
          Format
        </h4>
        <AppSelect
          id="format-select"
          options={FORMAT_OPTIONS}
          value={props.formatValue()}
          onChange={(v) => props.setFormatValue(v)}
          disabled={!props.controlsActive() || props.formatSelectDisabled()}
          placeholder="Keep original"
        />
      </div>

      {/* Quality */}
      <div class="flex flex-col gap-2.5 border-t border-sp-border-light pt-5">
        <div class="flex justify-between items-center">
          <h4 class="text-[0.8rem] font-semibold text-sp-text m-0 uppercase tracking-wider">
            Quality
          </h4>
          <span id="quality-value" class="text-[0.8rem] font-medium text-sp-text-muted">
            {props.qualityValue()}%
          </span>
        </div>
        <input
          type="range"
          id="quality-slider"
          min="0"
          max="100"
          value={props.qualityValue()}
          class="sp-slider"
          disabled={!props.controlsActive()}
          onInput={(e) => props.setQualityValue(parseInt((e.target as HTMLInputElement).value, 10))}
        />
      </div>

      {/* Process Button */}
      <button
        type="button"
        id="process-button"
        class="sp-process-btn"
        classList={{ "sp-process-btn-loading": props.isProcessing() }}
        disabled={!props.controlsActive()}
        onClick={() => props.onProcess()}
      >
        <Show when={props.isProcessing()}>
          <span class="sp-btn-spinner" aria-hidden="true" />
        </Show>
        <span>{props.processBtnLabel()}</span>
      </button>
    </div>
  );
}
