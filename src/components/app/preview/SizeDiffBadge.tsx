import { Show } from "solid-js";
import type { SizeDiff } from "@/components/app/state/ImageAppContext";

interface SizeDiffBadgeProps {
  diff: SizeDiff | null;
}

export default function SizeDiffBadge(props: SizeDiffBadgeProps) {
  return (
    <Show when={props.diff}>
      {(diff) => (
        <p id="size-difference" class={diff().className}>
          {diff().text}
        </p>
      )}
    </Show>
  );
}
