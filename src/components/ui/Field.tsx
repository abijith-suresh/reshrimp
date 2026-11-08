import type { JSX } from "solid-js";
import { FIELD_LABEL_CLASSES } from "@/components/ui/control";

interface FieldProps {
  label: string;
  labelAccessory?: JSX.Element;
  children: JSX.Element;
}

export default function Field(props: FieldProps) {
  return (
    <div>
      <div class="mb-1.5 flex items-center gap-1.5">
        <span class={FIELD_LABEL_CLASSES}>{props.label}</span>
        {props.labelAccessory}
      </div>
      {props.children}
    </div>
  );
}
