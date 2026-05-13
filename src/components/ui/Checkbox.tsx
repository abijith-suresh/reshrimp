interface CheckboxProps {
  id?: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export default function Checkbox(props: CheckboxProps) {
  return (
    <label class="flex items-center gap-2 text-[0.85rem] text-sp-text cursor-pointer select-none">
      <button
        type="button"
        role="checkbox"
        id={props.id}
        aria-checked={props.checked}
        disabled={props.disabled}
        class="relative flex items-center justify-center w-[18px] h-[18px] rounded-[5px] border-[1.5px] transition-all duration-200 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed active:scale-90"
        classList={{
          "bg-sp-lavender border-sp-lavender": props.checked,
          "bg-white border-sp-border hover:border-sp-lavender": !props.checked,
        }}
        onClick={() => props.onChange(!props.checked)}
      >
        <svg
          class="w-3 h-3 text-white transition-transform duration-150"
          classList={{
            "scale-100": props.checked,
            "scale-0": !props.checked,
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
      </button>
      <span class={props.disabled ? "opacity-40" : ""}>{props.label}</span>
    </label>
  );
}
