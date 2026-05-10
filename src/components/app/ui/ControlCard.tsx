import type { JSX } from "solid-js";

interface ControlCardProps {
  id?: string;
  class?: string;
  inactive?: boolean;
  children: JSX.Element;
}

export default function ControlCard(props: ControlCardProps) {
  return (
    <div
      id={props.id}
      class={`bg-sp-bg-card border border-sp-border rounded-sp-xl p-6 shadow-sp flex flex-col gap-5 flex-1 transition-[opacity,filter] duration-400 ease-in-out${props.class ? ` ${props.class}` : ""}`}
      classList={{ "controls-inactive": !!props.inactive }}
    >
      {props.children}
    </div>
  );
}
