import { CONTROL_CLASSES, FIELD_LABEL_CLASSES } from "@/components/ui/control";

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
      <span class={`mb-1.5 block ${FIELD_LABEL_CLASSES}`}>{props.label}</span>
      <input
        id={props.id}
        type={props.type ?? "number"}
        inputMode={props.inputMode}
        class={`w-full ${CONTROL_CLASSES}`}
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
