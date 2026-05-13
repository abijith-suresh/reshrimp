interface AppInputProps {
  id?: string;
  label: string;
  type?: "number" | "text";
  value: string;
  onInput: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  min?: number | string;
  max?: number | string;
  step?: number | string;
}

export default function AppInput(props: AppInputProps) {
  return (
    <label class="block">
      <span class="block text-[0.75rem] text-sp-text-muted mb-1 font-medium">{props.label}</span>
      <input
        id={props.id}
        type={props.type ?? "number"}
        class="w-full px-3 py-2.5 border border-sp-border rounded-sp-lg font-body text-[0.85rem] text-sp-text bg-sp-bg transition-[border-color,box-shadow] duration-200 focus:outline-none focus:border-sp-lavender focus:shadow-[0_0_0_3px_rgba(167,139,250,0.15)]"
        min={props.min ?? "0.001"}
        max={props.max ?? "100000"}
        step={props.step ?? "any"}
        placeholder={props.placeholder}
        disabled={props.disabled}
        value={props.value}
        onInput={(e) => props.onInput((e.target as HTMLInputElement).value)}
      />
    </label>
  );
}
