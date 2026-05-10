import { Show, createEffect, onCleanup, type JSX } from "solid-js";
import { Info } from "lucide-solid";

interface InfoTooltipProps {
  id?: string;
  ariaLabel: string;
  content: JSX.Element;
  open: boolean;
  onToggle: (open: boolean) => void;
}

export default function InfoTooltip(props: InfoTooltipProps) {
  let containerRef: HTMLSpanElement | undefined = undefined;

  createEffect(() => {
    if (!props.open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef && !containerRef.contains(e.target as Node)) {
        props.onToggle(false);
      }
    };
    document.addEventListener("click", handler);
    onCleanup(() => document.removeEventListener("click", handler));
  });

  return (
    <span ref={(el) => (containerRef = el)} id={props.id} class="relative inline-flex">
      <button
        id={props.id ? `${props.id}-icon` : undefined}
        type="button"
        class="info-icon"
        aria-label={props.ariaLabel}
        onClick={(e) => {
          e.stopPropagation();
          props.onToggle(!props.open);
        }}
      >
        <Info size={14} aria-hidden="true" />
      </button>
      <Show when={props.open}>
        <span
          id={props.id ? `${props.id}-tooltip` : undefined}
          class="info-tooltip active"
          role="tooltip"
        >
          {props.content}
        </span>
      </Show>
    </span>
  );
}
