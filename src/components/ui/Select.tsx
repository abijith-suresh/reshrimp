import { For } from "solid-js";
import { CONTROL_CLASSES } from "@/components/ui/control";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

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
        class={`w-full appearance-none cursor-pointer pr-8 ${CONTROL_CLASSES}${props.class ? ` ${props.class}` : ""}`}
      >
        <For each={props.options}>
          {(option) => (
            <option value={option.value} disabled={option.disabled}>
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
