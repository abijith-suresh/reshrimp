import type { JSX } from "solid-js";

interface PanelCardProps {
  title: string;
  children: JSX.Element;
}

// A white Cards section in the app's controls panel.
export default function PanelCard(props: PanelCardProps) {
  return (
    <div class="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4 shadow-xs">
      <h2 class="text-sm font-semibold text-fg">{props.title}</h2>
      {props.children}
    </div>
  );
}
