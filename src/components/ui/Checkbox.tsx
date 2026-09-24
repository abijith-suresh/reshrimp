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
      class="flex items-center gap-2 text-sm text-foreground cursor-pointer select-none transition-opacity duration-200"
      classList={{ "opacity-40 cursor-not-allowed": props.disabled }}
    >
      <span class="relative flex items-center justify-center w-[18px] h-[18px] shrink-0">
        <input
          type="checkbox"
          id={props.id}
          checked={props.checked}
          disabled={props.disabled}
          onChange={(e) => props.onChange(e.target.checked)}
          class="sr-only"
          style={{ "touch-action": "manipulation" }}
        />
        <span
          class="absolute inset-0 rounded-sm border-[1.5px] transition-[background-color,border-color,box-shadow] duration-200 pointer-events-none focus-within:ring-2 focus-within:ring-lavender-500 focus-within:ring-offset-2"
          classList={{
            "bg-lavender-500 border-lavender-500": props.checked,
            "bg-white border-border": !props.checked,
          }}
        >
          <svg
            aria-hidden="true"
            class="absolute inset-0 m-auto h-3 w-3 text-white transition-[opacity,scale] duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
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
