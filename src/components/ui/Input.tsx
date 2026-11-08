interface InputProps {
  id?: string;
  label: string;
  type?: "number" | "text";
  inputMode?: "numeric" | "decimal";
  value: string;
  onInput: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  min?: number | string;
  max?: number | string;
  step?: number | string;
}

export default function Input(props: InputProps) {
  return (
    <label class="block">
      <span class="block text-xs text-fg-muted mb-1 font-medium">{props.label}</span>
      <input
        id={props.id}
        type={props.type ?? "number"}
        inputMode={props.inputMode}
        class="w-full px-3 py-2.5 border border-line-strong rounded-lg font-body text-base editor:text-sm text-fg bg-canvas transition-[border-color,box-shadow] duration-200 focus-visible:outline-hidden focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20"
        min={props.type === "text" ? undefined : (props.min ?? "0.001")}
        max={props.type === "text" ? undefined : (props.max ?? "100000")}
        step={props.type === "text" ? undefined : (props.step ?? "any")}
        placeholder={props.placeholder}
        disabled={props.disabled}
        value={props.value}
        onInput={(e) => props.onInput((e.target as HTMLInputElement).value)}
      />
    </label>
  );
}
