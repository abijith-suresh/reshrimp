import type { JSX } from "solid-js";

interface FieldProps {
  label: string;
  labelAccessory?: JSX.Element;
  children: JSX.Element;
}

export default function Field(props: FieldProps) {
  return (
    <div>
      <div class="flex items-center gap-1.5 mb-1">
        <span class="text-[0.8rem] text-muted-foreground">{props.label}</span>
        {props.labelAccessory}
      </div>
      {props.children}
    </div>
  );
}
