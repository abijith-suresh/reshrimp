interface InputProps {
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

const errorClasses = "border-coral-300 bg-coral-50 focus-visible:ring-coral-500/40";
const successClasses = "border-mint-300 bg-mint-50 focus-visible:ring-mint-500/40";

export { errorClasses, successClasses };

export default function Input(props: InputProps) {
  return (
    <label class="block">
      <span class="block text-[0.75rem] text-muted-foreground mb-1 font-medium">{props.label}</span>
      <input
        id={props.id}
        type={props.type ?? "number"}
        class="w-full px-3 py-2.5 border border-border rounded-lg font-body text-[0.85rem] text-foreground bg-background transition-[border-color,box-shadow] duration-200 focus-visible:outline-hidden focus-visible:border-lavender-500 focus-visible:ring-2 focus-visible:ring-ring"
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
