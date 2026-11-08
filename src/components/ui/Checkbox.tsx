interface CheckboxProps {
  id?: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export default function Checkbox(props: CheckboxProps) {
  return (
    <label
      class="flex min-h-10 cursor-pointer select-none items-center gap-2.5 text-sm text-fg transition-opacity duration-150 pointer-coarse:min-h-11"
      classList={{ "opacity-50 cursor-not-allowed": props.disabled }}
    >
      <span class="relative flex size-5 shrink-0 items-center justify-center">
        <input
          type="checkbox"
          id={props.id}
          checked={props.checked}
          disabled={props.disabled}
          onChange={(e) => props.onChange(e.target.checked)}
          class="peer sr-only touch-manipulation"
        />
        <span
          class="pointer-events-none absolute inset-0 rounded-xs border transition-colors duration-150 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring"
          classList={{
            "bg-primary border-primary": props.checked,
            "bg-surface border-fg-soft": !props.checked,
          }}
        >
          <svg
            aria-hidden="true"
            class="absolute inset-0 m-auto size-3 text-primary-fg transition-[opacity,scale] duration-150 ease-pop"
            classList={{
              "scale-100 opacity-100": props.checked,
              "scale-75 opacity-0": !props.checked,
            }}
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M2 6l3 3 5-5" />
          </svg>
        </span>
      </span>
      <span>{props.label}</span>
    </label>
  );
}
