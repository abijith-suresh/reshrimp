import { Info } from "lucide-solid";
import { createEffect, createSignal, type JSX, onCleanup, Show } from "solid-js";
import { Portal } from "solid-js/web";

interface InfoTooltipProps {
  id?: string;
  ariaLabel: string;
  content: JSX.Element;
  open: boolean;
  onToggle: (open: boolean) => void;
}

interface TooltipPos {
  left: number;
  width: number;
  arrowLeft: number;
  placement: "above" | "below";
  top?: number;
  bottom?: number;
}

const TOOLTIP_MAX_WIDTH = 220;
const TOOLTIP_VIEWPORT_GUTTER = 8;
const TOOLTIP_ARROW_INSET = 12;
const TOOLTIP_GAP = 8;

export default function InfoTooltip(props: InfoTooltipProps) {
  const [triggerEl, setTriggerEl] = createSignal<HTMLButtonElement | null>(null);
  let pointerInside = false;
  let openedByFocus = false;

  const [pos, setPos] = createSignal<TooltipPos>({
    bottom: 0,
    left: 0,
    width: TOOLTIP_MAX_WIDTH,
    arrowLeft: TOOLTIP_MAX_WIDTH / 2,
    placement: "above",
  });
  let tooltipEl: HTMLSpanElement | undefined;

  function calcPos(): TooltipPos {
    const el = triggerEl();
    if (!el) {
      return {
        bottom: 0,
        left: 0,
        width: TOOLTIP_MAX_WIDTH,
        arrowLeft: TOOLTIP_MAX_WIDTH / 2,
        placement: "above",
      };
    }
    const r = el.getBoundingClientRect();
    const dialog = el.closest<HTMLElement>('[role="dialog"]');
    const dialogRect = dialog?.getBoundingClientRect();
    const dialogStyle = dialog ? window.getComputedStyle(dialog) : null;
    const rootStyle = window.getComputedStyle(document.documentElement);
    const dialogPaddingLeft = Number.parseFloat(dialogStyle?.paddingLeft ?? "") || 0;
    const dialogPaddingRight = Number.parseFloat(dialogStyle?.paddingRight ?? "") || 0;
    const dialogPaddingTop = Number.parseFloat(dialogStyle?.paddingTop ?? "") || 0;
    const dialogPaddingBottom = Number.parseFloat(dialogStyle?.paddingBottom ?? "") || 0;
    const safeAreaLeft =
      Number.parseFloat(rootStyle.getPropertyValue("--safe-area-inset-left")) || 0;
    const safeAreaRight =
      Number.parseFloat(rootStyle.getPropertyValue("--safe-area-inset-right")) || 0;
    const safeAreaTop = Number.parseFloat(rootStyle.getPropertyValue("--safe-area-inset-top")) || 0;
    const safeAreaBottom =
      Number.parseFloat(rootStyle.getPropertyValue("--safe-area-inset-bottom")) || 0;
    const availableLeft = Math.max((dialogRect?.left ?? 0) + dialogPaddingLeft, safeAreaLeft);
    const availableRight = Math.min(
      (dialogRect?.right ?? window.innerWidth) - dialogPaddingRight,
      window.innerWidth - safeAreaRight
    );
    const availableTop = Math.max((dialogRect?.top ?? 0) + dialogPaddingTop, safeAreaTop);
    const availableBottom = Math.min(
      (dialogRect?.bottom ?? window.innerHeight) - dialogPaddingBottom,
      window.innerHeight - safeAreaBottom
    );
    const availableWidth = Math.max(0, availableRight - availableLeft);
    const width = Math.min(TOOLTIP_MAX_WIDTH, Math.max(0, availableWidth - 16));
    const gutter = Math.min(TOOLTIP_VIEWPORT_GUTTER, (availableWidth - width) / 2);
    const tooltipLeft = Math.max(
      availableLeft + gutter,
      Math.min(r.left + r.width / 2 - width / 2, availableRight - width - gutter)
    );
    const arrowInset = Math.min(TOOLTIP_ARROW_INSET, width / 2);
    const arrowLeft = Math.max(
      arrowInset,
      Math.min(r.left + r.width / 2 - tooltipLeft, width - arrowInset)
    );
    const tooltipHeight = tooltipEl?.getBoundingClientRect().height ?? 0;
    const spaceAbove = Math.max(0, r.top - availableTop - TOOLTIP_GAP);
    const spaceBelow = Math.max(0, availableBottom - r.bottom - TOOLTIP_GAP);
    const fitsAbove = spaceAbove >= tooltipHeight;
    const fitsBelow = spaceBelow >= tooltipHeight;
    const placement = fitsAbove
      ? "above"
      : fitsBelow || spaceBelow > spaceAbove
        ? "below"
        : "above";

    if (placement === "below") {
      return {
        top: r.bottom + TOOLTIP_GAP - (dialogRect?.top ?? 0),
        left: tooltipLeft + width / 2 - (dialogRect?.left ?? 0),
        width,
        arrowLeft,
        placement,
      };
    }

    return {
      bottom: (dialogRect?.bottom ?? window.innerHeight) - r.top + TOOLTIP_GAP,
      left: tooltipLeft + width / 2 - (dialogRect?.left ?? 0),
      width,
      arrowLeft,
      placement,
    };
  }

  function getPortalTarget(): HTMLElement {
    return triggerEl()?.closest<HTMLElement>('[role="dialog"]') ?? document.body;
  }

  function isTriggerHidden(element: HTMLElement): boolean {
    let current: HTMLElement | null = element;
    while (current) {
      const styles = window.getComputedStyle(current);
      if (styles.display === "none" || styles.visibility === "hidden") return true;
      current = current.parentElement;
    }
    return false;
  }

  createEffect(() => {
    if (!props.open) return;
    setPos(calcPos());

    function update() {
      const trigger = triggerEl();
      if (trigger && isTriggerHidden(trigger)) {
        pointerInside = false;
        openedByFocus = false;
        props.onToggle(false);
        return;
      }
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
      const trigger = triggerEl();
      if (trigger && !trigger.contains(e.target as Node)) {
        props.onToggle(false);
      }
    };

    document.addEventListener("click", handler);
    onCleanup(() => document.removeEventListener("click", handler));
  });

  createEffect(() => {
    if (!props.open) return;

    const handler = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      pointerInside = false;
      openedByFocus = false;
      props.onToggle(false);
    };

    // Close the tooltip before Escape reaches the enclosing mobile dialog.
    document.addEventListener("keydown", handler, true);
    onCleanup(() => document.removeEventListener("keydown", handler, true));
  });

  function handleFocus() {
    openedByFocus = !props.open;
    props.onToggle(true);
  }

  function handleMouseEnter() {
    pointerInside = true;
    props.onToggle(true);
  }

  function handleBlur() {
    openedByFocus = false;
    props.onToggle(false);
  }

  function handleMouseLeave() {
    pointerInside = false;
    openedByFocus = false;
    props.onToggle(false);
  }

  return (
    <span id={props.id} class="relative inline-flex">
      <button
        id={props.id ? `${props.id}-icon` : undefined}
        type="button"
        class="inline-flex items-center justify-center w-5 h-5 p-0 text-muted-foreground bg-transparent border-none rounded-full cursor-pointer transition-colors duration-200 hover:text-lavender-500 focus-visible:outline-2 focus-visible:outline-lavender-500 focus-visible:outline-offset-2"
        aria-label={props.ariaLabel}
        ref={setTriggerEl}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={(e) => {
          e.stopPropagation();
          // Pointer and keyboard activation already opened the tooltip via
          // hover or focus. Keep it open instead of closing it in the same
          // browser event sequence.
          if (pointerInside || openedByFocus) return;
          props.onToggle(!props.open);
        }}
        aria-describedby={props.open && props.id ? `${props.id}-tooltip` : undefined}
      >
        <Info size={14} aria-hidden="true" />
      </button>
      <Show when={props.open}>
        <Portal mount={getPortalTarget()}>
          <span
            ref={(element) => {
              tooltipEl = element;
            }}
            id={props.id ? `${props.id}-tooltip` : undefined}
            class={`info-tooltip active info-tooltip-portaled text-xs leading-[1.4] text-foreground ${pos().placement === "below" ? "info-tooltip-below" : ""}`}
            role="tooltip"
            style={{
              "--tooltip-arrow-left": `${pos().arrowLeft}px`,
              top: pos().top === undefined ? undefined : `${pos().top}px`,
              bottom: pos().bottom === undefined ? undefined : `${pos().bottom}px`,
              left: `${pos().left}px`,
              width: `${pos().width}px`,
            }}
          >
            {props.content}
          </span>
        </Portal>
      </Show>
    </span>
  );
}
