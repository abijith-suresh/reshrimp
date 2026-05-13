import { Show, createEffect, createSignal, onCleanup, type JSX } from "solid-js";
import { Portal } from "solid-js/web";
import { Info } from "lucide-solid";

interface InfoTooltipProps {
  id?: string;
  ariaLabel: string;
  content: JSX.Element;
  open: boolean;
  onToggle: (open: boolean) => void;
}

interface TooltipPos {
  bottom: number;
  left: number;
}

export default function InfoTooltip(props: InfoTooltipProps) {
  const [triggerEl, setTriggerEl] = createSignal<HTMLButtonElement | null>(null);

  const [pos, setPos] = createSignal<TooltipPos>({ bottom: 0, left: 0 });

  function calcPos(): TooltipPos {
    const el = triggerEl();
    if (!el) return { bottom: 0, left: 0 };
    const r = el.getBoundingClientRect();
    return {
      bottom: window.innerHeight - r.top + 8,
      left: r.left + r.width / 2,
    };
  }

  createEffect(() => {
    if (!props.open) return;
    setPos(calcPos());

    function update() {
      setPos(calcPos());
    }

    window.addEventListener("resize", update, { passive: true });
    window.addEventListener("scroll", update, { passive: true, capture: true });
    onCleanup(() => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, { capture: true });
    });
  });

  createEffect(() => {
    if (!props.open) return;
    const el = triggerEl();
    if (!el) return;

    const handler = (e: MouseEvent) => {
      if (!el!.contains(e.target as Node)) {
        props.onToggle(false);
      }
    };

    document.addEventListener("click", handler);
    onCleanup(() => document.removeEventListener("click", handler));
  });

  function handleEnter() {
    props.onToggle(true);
  }

  function handleLeave() {
    props.onToggle(false);
  }

  return (
    <span
      id={props.id}
      class="relative inline-flex"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <button
        id={props.id ? `${props.id}-icon` : undefined}
        type="button"
        class="info-icon"
        aria-label={props.ariaLabel}
        ref={setTriggerEl}
        onFocus={handleEnter}
        onBlur={handleLeave}
        onClick={(e) => {
          e.stopPropagation();
          props.onToggle(!props.open);
        }}
      >
        <Info size={14} aria-hidden="true" />
      </button>
      <Show when={props.open}>
        <Portal>
          <span
            id={props.id ? `${props.id}-tooltip` : undefined}
            class="info-tooltip active"
            role="tooltip"
            style={{
              position: "fixed",
              bottom: `${pos().bottom}px`,
              left: `${pos().left}px`,
              transform: "translateX(-50%)",
              width: "220px",
              "z-index": "9999",
            }}
          >
            {props.content}
          </span>
        </Portal>
      </Show>
    </span>
  );
}
