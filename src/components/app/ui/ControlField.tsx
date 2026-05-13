import type { JSX } from "solid-js";

interface ControlFieldProps {
  label: string;
  labelAccessory?: JSX.Element;
  children: JSX.Element;
}

export default function ControlField(props: ControlFieldProps) {
  return (
    <div>
      <div class="flex items-center gap-1.5 mb-1">
        <span class="text-[0.8rem] text-sp-text-muted">{props.label}</span>
        {props.labelAccessory}
      </div>
      {props.children}
    </div>
  );
}
