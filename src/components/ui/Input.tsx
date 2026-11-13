import { CONTROL_CLASSES, FIELD_LABEL_CLASSES } from "@/components/ui/control";

interface InputProps {
  id?: string;
  label: string;
  type?: "text";
  inputMode?: "numeric" | "decimal";
  value: string;
  onInput: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function Input(props: InputProps) {
  return (
    <label class="block">
      <span class={`mb-1.5 block ${FIELD_LABEL_CLASSES}`}>{props.label}</span>
      <input
        id={props.id}
        type={props.type ?? "text"}
        inputMode={props.inputMode}
        class={`w-full ${CONTROL_CLASSES}`}
        placeholder={props.placeholder}
        disabled={props.disabled}
        value={props.value}
        onInput={(e) => props.onInput((e.target as HTMLInputElement).value)}
      />
    </label>
  );
}
