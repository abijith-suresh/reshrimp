interface AppCheckboxProps {
  id?: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export default function AppCheckbox(props: AppCheckboxProps) {
  return (
    <label class="flex items-center gap-2 text-[0.85rem] text-sp-text cursor-pointer">
      <input
        id={props.id}
        type="checkbox"
        checked={props.checked}
        disabled={props.disabled}
        class="w-4 h-4 accent-sp-lavender cursor-pointer"
        onChange={(e) => props.onChange((e.target as HTMLInputElement).checked)}
      />
      <span>{props.label}</span>
    </label>
  );
}
