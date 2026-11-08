import { For } from "solid-js";
import { CONTROL_CLASSES } from "@/components/ui/control";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

// Where appearance: base-select is supported, the open picker gets the app's
// dropdown look; elsewhere the browser's native list shows. The chevron below
// stays in both, so the built-in picker icon is hidden.
const BASE_SELECT_CLASSES =
  "base-select:[appearance:base-select] base-select:items-center base-select:[&::picker-icon]:hidden base-select:open:outline-2 base-select:open:outline-offset-2 base-select:open:outline-ring base-select:picker:[appearance:base-select] base-select:picker:[position-try-order:normal] base-select:picker:my-1 base-select:picker:max-h-60 base-select:picker:overflow-y-auto base-select:picker:rounded-md base-select:picker:border base-select:picker:border-line-strong base-select:picker:bg-surface base-select:picker:p-1 base-select:picker:shadow-md base-select:picker:origin-top base-select:picker:motion-safe:animate-select-in";

const BASE_OPTION_CLASSES =
  "base-select:cursor-pointer base-select:rounded-sm base-select:px-2.5 base-select:py-2 base-select:font-body base-select:text-sm base-select:text-fg base-select:transition-colors base-select:duration-150 base-select:ease-out base-select:hover:bg-hover base-select:focus-visible:bg-hover base-select:focus-visible:outline-hidden base-select:checked:font-semibold base-select:disabled:cursor-not-allowed base-select:disabled:opacity-40 base-select:[&::checkmark]:order-1 base-select:[&::checkmark]:ms-auto base-select:[&::checkmark]:size-3 base-select:[&::checkmark]:bg-primary base-select:[&::checkmark]:content-[''] base-select:[&::checkmark]:mask-(--mask-check) base-select:[&::checkmark]:mask-contain base-select:[&::checkmark]:mask-center base-select:[&::checkmark]:mask-no-repeat";

interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  id?: string;
  ariaLabel?: string;
  class?: string;
}

export default function Select(props: SelectProps) {
  return (
    <div class="relative">
      <select
        id={props.id}
        aria-label={props.ariaLabel}
        disabled={props.disabled}
        value={props.value}
        onChange={(event) => props.onChange(event.currentTarget.value)}
        class={`w-full appearance-none cursor-pointer pr-8 ${CONTROL_CLASSES} ${BASE_SELECT_CLASSES}${props.class ? ` ${props.class}` : ""}`}
      >
        <For each={props.options}>
          {(option) => (
            <option value={option.value} disabled={option.disabled} class={BASE_OPTION_CLASSES}>
              {option.label}
            </option>
          )}
        </For>
      </select>
      <svg
        class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-fg-soft"
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4.5l3 3 3-3" />
      </svg>
    </div>
  );
}
